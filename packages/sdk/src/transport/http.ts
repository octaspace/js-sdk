import {
  OctaApiError,
  OctaAuthenticationError,
  OctaNetworkError,
  OctaNotFoundError,
  OctaPermissionError,
  OctaRateLimitError,
  OctaServerError,
  OctaTimeoutError,
  OctaValidationError,
} from '../errors/index.js'
import { withRetry } from '../utils/retry.js'
import type { ApiResponse, RequestContext, RequestOptions, ResponseContext } from './types.js'

export interface HttpTransportOptions {
  baseUrl: string
  apiKey?: string
  timeoutMs: number
  retries: number
  userAgent: string
  fetch?: typeof globalThis.fetch
  onRequest?: (ctx: RequestContext) => void | Promise<void>
  onResponse?: (ctx: ResponseContext) => void | Promise<void>
}

export class HttpTransport {
  private readonly fetchFn: typeof globalThis.fetch

  constructor(private readonly opts: HttpTransportOptions) {
    this.fetchFn = opts.fetch ?? globalThis.fetch.bind(globalThis)
  }

  async request<T>(options: RequestOptions): Promise<ApiResponse<T>> {
    const maxRetries = options.retries ?? this.opts.retries

    return withRetry((attempt) => this.executeRequest<T>(options, attempt), {
      maxRetries,
      method: options.method,
      initialDelayMs: 500,
      maxDelayMs: 10_000,
    })
  }

  private async executeRequest<T>(
    options: RequestOptions,
    attempt: number,
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(options.path, options.query)
    const headers = this.buildHeaders(options)

    const ctx: RequestContext = {
      method: options.method,
      url,
      headers,
      body: options.body,
      attempt,
    }

    await this.opts.onRequest?.(ctx)

    const timeoutSignal = AbortSignal.timeout(this.opts.timeoutMs)
    let signal = timeoutSignal
    let cleanupAbort: (() => void) | undefined

    if (options.signal) {
      if (typeof AbortSignal.any === 'function') {
        signal = AbortSignal.any([options.signal, timeoutSignal])
      } else {
        const controller = new AbortController()
        const abort = () => controller.abort()

        if (options.signal.aborted || timeoutSignal.aborted) {
          abort()
        } else {
          options.signal.addEventListener('abort', abort)
          timeoutSignal.addEventListener('abort', abort)
          cleanupAbort = () => {
            options.signal?.removeEventListener('abort', abort)
            timeoutSignal.removeEventListener('abort', abort)
          }
        }
        signal = controller.signal
      }
    }

    const startMs = Date.now()

    let response: Response
    try {
      response = await this.fetchFn(url, {
        method: options.method,
        headers,
        ...(options.body !== undefined && { body: JSON.stringify(options.body) }),
        signal,
      })
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        if (options.signal?.aborted) {
          throw new OctaNetworkError('Request was aborted')
        }
        throw new OctaTimeoutError(`Request timed out after ${this.opts.timeoutMs}ms`)
      }
      throw new OctaNetworkError(err instanceof Error ? err.message : 'Network error')
    } finally {
      cleanupAbort?.()
    }

    const durationMs = Date.now() - startMs
    const responseCtx: ResponseContext = {
      request: ctx,
      status: response.status,
      headers: response.headers,
      durationMs,
    }
    await this.opts.onResponse?.(responseCtx)

    if (!response.ok) {
      await this.throwApiError(response)
    }

    const responseType = options.responseType ?? 'json'
    let data: T

    if (responseType === 'blob') {
      data = (await response.blob()) as T
    } else if (responseType === 'text') {
      data = (await response.text()) as T
    } else {
      const text = await response.text()
      data = text ? (JSON.parse(text) as T) : (undefined as T)
    }

    const requestId = response.headers.get('x-request-id')
    return {
      data,
      status: response.status,
      headers: response.headers,
      ...(requestId !== null && { requestId }),
    }
  }

  private buildUrl(
    path: string,
    query?: Record<string, string | number | boolean | undefined>,
  ): string {
    const base = this.opts.baseUrl.replace(/\/$/, '')
    const url = new URL(`${base}${path}`)

    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value))
        }
      }
    }

    return url.toString()
  }

  private buildHeaders(options: RequestOptions): Headers {
    const headers = new Headers()
    headers.set('User-Agent', this.opts.userAgent)
    headers.set('Accept', 'application/json')

    if (!options.skipAuth) {
      if (!this.opts.apiKey) {
        throw new OctaAuthenticationError('apiKey is required for authenticated endpoints', 401)
      }
      headers.set('Authorization', this.opts.apiKey)
    }

    if (options.body !== undefined) {
      headers.set('Content-Type', 'application/json')
    }

    return headers
  }

  private async throwApiError(response: Response): Promise<never> {
    let body: unknown
    const requestId = response.headers.get('x-request-id') ?? undefined
    const retryAfterHeader = response.headers.get('retry-after')
    const retryAfter = retryAfterHeader ? Number(retryAfterHeader) : undefined

    try {
      const text = await response.text()
      body = text ? JSON.parse(text) : undefined
    } catch {
      // ignore parse errors
    }

    const message =
      (body as Record<string, string> | undefined)?.message ??
      (body as Record<string, string> | undefined)?.error ??
      `Request failed with status ${response.status}`

    const code = (body as Record<string, string> | undefined)?.code

    switch (response.status) {
      case 401:
        throw new OctaAuthenticationError(message, response.status, code, requestId, body)
      case 403:
        throw new OctaPermissionError(message, response.status, code, requestId, body)
      case 404:
        throw new OctaNotFoundError(message, response.status, code, requestId, body)
      case 422:
        throw new OctaValidationError(message, response.status, code, requestId, body)
      case 429:
        throw new OctaRateLimitError(message, response.status, retryAfter, code, requestId, body)
      default:
        if (response.status >= 500) {
          throw new OctaServerError(message, response.status, code, requestId, body)
        }
        throw new OctaApiError(message, response.status, code, requestId, body)
    }
  }
}
