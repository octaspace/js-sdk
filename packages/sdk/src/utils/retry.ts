import { OctaApiError, OctaNetworkError } from '../errors/index.js'
import type { HttpMethod } from '../transport/types.js'

const SAFE_METHODS = new Set<HttpMethod>(['GET'])

/** HTTP statuses worth retrying: rate limit and transient gateway/backend failures. */
const RETRYABLE_STATUSES = new Set([429, 502, 503, 504])

/**
 * Longest server-supplied `Retry-After` the SDK waits for on its own. A longer wait (for example
 * the 5-minute per-session restart cooldown) is surfaced to the caller instead of blocking.
 */
export const MAX_RETRY_AFTER_SECONDS = 60

export interface RetryOptions {
  maxRetries: number
  method: HttpMethod
  /** Allow retries for a non-safe method the API documents as idempotent */
  idempotent?: boolean
  initialDelayMs: number
  maxDelayMs: number
  signal?: AbortSignal
}

function isRetryable(error: unknown): boolean {
  if (error instanceof OctaNetworkError) {
    return true
  }
  return error instanceof OctaApiError && RETRYABLE_STATUSES.has(error.status)
}

function jitteredDelay(attempt: number, opts: RetryOptions): number {
  const exponential = opts.initialDelayMs * 2 ** attempt
  const cap = Math.min(opts.maxDelayMs, exponential)
  return Math.random() * cap
}

function retryAfterSeconds(error: unknown): number | undefined {
  return error instanceof OctaApiError ? error.retryAfter : undefined
}

export async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  opts: RetryOptions,
): Promise<T> {
  const canRetryMethod = SAFE_METHODS.has(opts.method) || opts.idempotent === true

  for (let attempt = 0; ; attempt++) {
    try {
      return await fn(attempt)
    } catch (err) {
      const retryAfter = retryAfterSeconds(err)
      const shouldRetry =
        canRetryMethod &&
        attempt < opts.maxRetries &&
        isRetryable(err) &&
        !opts.signal?.aborted &&
        (retryAfter === undefined || retryAfter <= MAX_RETRY_AFTER_SECONDS)

      if (!shouldRetry) {
        throw err
      }

      const delayMs = retryAfter !== undefined ? retryAfter * 1000 : jitteredDelay(attempt, opts)
      await sleep(delayMs, opts.signal)
    }
  }
}

/**
 * Waits `ms`, or rejects with `OctaNetworkError('Request was aborted')` as soon as `signal` aborts
 * — the same error an abort during the request itself produces.
 */
export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new OctaNetworkError('Request was aborted'))
      return
    }
    const onAbort = () => {
      clearTimeout(timer)
      reject(new OctaNetworkError('Request was aborted'))
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}
