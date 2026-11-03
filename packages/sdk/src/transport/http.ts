import {
  OctaApiError,
  type OctaApiErrorDetails,
  OctaAuthenticationError,
  OctaConflictError,
  OctaNetworkError,
  OctaNotFoundError,
  OctaPermissionError,
  OctaRateLimitError,
  OctaServerError,
  OctaServiceUnavailableError,
  OctaTimeoutError,
  OctaValidationError,
  type RateLimit,
} from '../errors/index.js'
import { withRetry } from '../utils/retry.js'
import type { ApiResponse, RequestContext, RequestOptions, ResponseContext } from './types.js'

export interface HttpTransportOptions {
  /** Base URLs tried in order; GET requests fail over to the next one on network errors */
  baseUrls: string[]
  apiKey?: string
  timeoutMs: number
  retries: number
  userAgent: string
  fetch?: typeof globalThis.fetch
  onRequest?: (ctx: RequestContext) => void | Promise<void>
  onResponse?: (ctx: ResponseContext) => void | Promise<void>
}

/** Prefix of the account API keys the next API issues (Cube → Profile → Credentials). */
export const API_KEY_PREFIX = 'octa_ak_'

/** Longest error message kept from a response body (e.g. when the server returns an HTML page). */
const MAX_ERROR_MESSAGE_LENGTH = 512

/**
 * Trims whitespace and a leading `Bearer ` scheme, so that a pasted header value is not sent as
 * `Bearer Bearer …`. Returns `undefined` for an empty key.
 */
export function normalizeApiKey(key: string | undefined): string | undefined {
  const trimmed = key?.trim().replace(/^bearer\s+/i, '')
  return trimmed ? trimmed : undefined
}

export class HttpTransport {
  private readonly fetchFn: typeof globalThis.fetch
  private readonly baseUrls: string[]
  private readonly apiKey: string | undefined
  private lastRateLimit: RateLimit | undefined

  constructor(private readonly opts: HttpTransportOptions) {
    this.fetchFn = opts.fetch ?? globalThis.fetch.bind(globalThis)
    this.baseUrls = opts.baseUrls.map((url) => url.trim().replace(/\/+$/, '')).filter(Boolean)
    if (this.baseUrls.length === 0) {
      throw new TypeError('At least one base URL is required')
    }
    this.apiKey = normalizeApiKey(opts.apiKey)
  }

  /** Whether the client was created with an API key */
  get hasApiKey(): boolean {
    return this.apiKey !== undefined
  }

  /** Rate limit state from the most recent response that carried `RateLimit-*` headers */
  get rateLimit(): RateLimit | undefined {
    return this.lastRateLimit
  }

  async request<T>(options: RequestOptions): Promise<ApiResponse<T>> {
    const maxRetries = options.retries ?? this.opts.retries

    return withRetry((attempt) => this.requestWithFailover<T>(options, attempt), {
      maxRetries,
      method: options.method,
      ...(options.idempotent !== undefined && { idempotent: options.idempotent }),
      ...(options.signal !== undefined && { signal: options.signal }),
      initialDelayMs: 500,
      maxDelayMs: 10_000,
    })
  }

  /**
   * Tries each base URL in order. Only GET requests fail over, and only on network-level errors:
   * an HTTP error response is the API's answer and is returned as is, and a request that changes
   * state is never sent twice to different hosts.
   */
  private async requestWithFailover<T>(
    options: RequestOptions,
    attempt: number,
  ): Promise<ApiResponse<T>> {
    const urls = options.method === 'GET' ? this.baseUrls : this.baseUrls.slice(0, 1)
    let lastError: unknown

    for (const baseUrl of urls) {
      try {
        return await this.executeRequest<T>(baseUrl, options, attempt)
      } catch (err) {
        if (!(err instanceof OctaNetworkError) || options.signal?.aborted) {
          throw err
        }
        lastError = err
      }
    }

    throw lastError
  }

  private async executeRequest<T>(
    baseUrl: string,
    options: RequestOptions,
    attempt: number,
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(baseUrl, options.path, options.query)
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
      if (isAbortError(err)) {
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

    const rateLimit = parseRateLimit(response.headers)
    if (rateLimit) {
      this.lastRateLimit = rateLimit
    }

    if (!response.ok) {
      await this.throwApiError(response, rateLimit)
    }

    const responseType = options.responseType ?? 'json'
    let data: T

    if (responseType === 'blob') {
      data = (await response.blob()) as T
    } else if (responseType === 'text') {
      data = (await response.text()) as T
    } else {
      // 202 and 204 responses may carry no body at all.
      const text = await response.text()
      data = text ? (JSON.parse(text) as T) : (undefined as T)
    }

    const requestId = response.headers.get('x-request-id')
    return {
      data,
      status: response.status,
      headers: response.headers,
      ...(requestId !== null && { requestId }),
      ...(rateLimit !== undefined && { rateLimit }),
    }
  }

  private buildUrl(
    baseUrl: string,
    path: string,
    query?: Record<string, string | number | boolean | undefined>,
  ): string {
    const url = new URL(`${baseUrl}${path}`)

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

    const auth = options.auth ?? 'required'
    if (auth !== 'none') {
      if (this.apiKey) {
        headers.set('Authorization', `Bearer ${this.apiKey}`)
      } else if (auth === 'required') {
        throw new OctaAuthenticationError(
          `apiKey is required for ${options.method} ${options.path}: pass an API key (${API_KEY_PREFIX}…) issued in Cube → Profile → Credentials`,
          401,
        )
      }
    }

    if (options.body !== undefined) {
      headers.set('Content-Type', 'application/json')
    }

    return headers
  }

  private async throwApiError(response: Response, rateLimit?: RateLimit): Promise<never> {
    let body: unknown
    let rawText = ''

    try {
      rawText = await response.text()
      body = rawText ? JSON.parse(rawText) : undefined
    } catch {
      body = undefined
    }

    const record = isRecord(body) ? body : undefined
    const bodyMessage = [record?.message, record?.error, record?.detail].find(
      (value): value is string => typeof value === 'string' && value !== '',
    )
    let message = truncate(
      bodyMessage ?? (rawText.trim() || `Request failed with status ${response.status}`),
    )

    if (response.status === 401 && this.apiKey && !this.apiKey.startsWith(API_KEY_PREFIX)) {
      message += ` (the next API expects a key starting with "${API_KEY_PREFIX}"; legacy account tokens are not accepted)`
    }

    const requestId = response.headers.get('x-request-id') ?? undefined
    const retryAfter = parseRetryAfter(response.headers.get('retry-after'))
    const code = typeof record?.code === 'string' ? record.code : undefined

    const details: OctaApiErrorDetails = {
      ...(code !== undefined && { code }),
      ...(requestId !== undefined && { requestId }),
      ...(body !== undefined && { body }),
      ...(retryAfter !== undefined && { retryAfter }),
      ...(rateLimit !== undefined && { rateLimit }),
    }

    const status = response.status
    switch (status) {
      case 400:
      case 422:
        throw new OctaValidationError(message, status, details)
      case 401:
        throw new OctaAuthenticationError(message, status, details)
      case 403:
        throw new OctaPermissionError(message, status, details)
      case 404:
        throw new OctaNotFoundError(message, status, details)
      case 409:
        throw new OctaConflictError(message, status, details)
      case 429:
        throw new OctaRateLimitError(message, status, details)
      case 503:
        throw new OctaServiceUnavailableError(message, status, details)
      default:
        if (status >= 500) {
          throw new OctaServerError(message, status, details)
        }
        throw new OctaApiError(message, status, details)
    }
  }
}

function isAbortError(err: unknown): boolean {
  return (
    (err instanceof DOMException || err instanceof Error) &&
    (err.name === 'AbortError' || err.name === 'TimeoutError')
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function truncate(message: string): string {
  return message.length > MAX_ERROR_MESSAGE_LENGTH
    ? `${message.slice(0, MAX_ERROR_MESSAGE_LENGTH)}…`
    : message
}

/** Parses `Retry-After` as delta-seconds or an HTTP date; returns whole seconds. */
export function parseRetryAfter(value: string | null): number | undefined {
  if (value === null || value.trim() === '') {
    return undefined
  }
  const trimmed = value.trim()
  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed)
  }
  const date = Date.parse(trimmed)
  if (Number.isNaN(date)) {
    return undefined
  }
  return Math.max(0, Math.ceil((date - Date.now()) / 1000))
}

/** Reads the `RateLimit-*` headers; `undefined` when none is present or one is not an integer. */
export function parseRateLimit(headers: Headers): RateLimit | undefined {
  const fields = [
    ['limit', 'ratelimit-limit'],
    ['remaining', 'ratelimit-remaining'],
    ['reset', 'ratelimit-reset'],
  ] as const
  const result: RateLimit = {}
  let found = false

  for (const [key, header] of fields) {
    const raw = headers.get(header)?.trim()
    if (!raw) {
      continue
    }
    if (!/^\d+$/.test(raw)) {
      return undefined
    }
    result[key] = Number(raw)
    found = true
  }

  return found ? result : undefined
}
