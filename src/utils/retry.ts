import { OctaNetworkError, OctaRateLimitError, OctaServerError } from '../errors/index.js'
import type { HttpMethod } from '../transport/types.js'

const SAFE_METHODS = new Set<HttpMethod>(['GET'])

export interface RetryOptions {
  maxRetries: number
  method: HttpMethod
  initialDelayMs: number
  maxDelayMs: number
}

function isRetryable(error: unknown): boolean {
  return (
    error instanceof OctaNetworkError ||
    error instanceof OctaServerError ||
    error instanceof OctaRateLimitError
  )
}

function jitteredDelay(attempt: number, opts: RetryOptions): number {
  const exponential = opts.initialDelayMs * 2 ** attempt
  const cap = Math.min(opts.maxDelayMs, exponential)
  return Math.random() * cap
}

function getRetryAfterMs(error: unknown): number | undefined {
  if (error instanceof OctaRateLimitError && error.retryAfter !== undefined) {
    return error.retryAfter * 1000
  }
  return undefined
}

export async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  opts: RetryOptions,
): Promise<T> {
  const canRetryMethod = SAFE_METHODS.has(opts.method)

  let lastError: unknown

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn(attempt)
    } catch (err) {
      lastError = err

      const shouldRetry = canRetryMethod && attempt < opts.maxRetries && isRetryable(err)

      if (!shouldRetry) {
        throw err
      }

      const delayMs = getRetryAfterMs(err) ?? jitteredDelay(attempt, opts)
      await sleep(delayMs)
    }
  }

  throw lastError
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
