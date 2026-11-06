import { OctaError } from './base.js'

/**
 * Rate limit state reported by the API in the `RateLimit-Limit`, `RateLimit-Remaining` and
 * `RateLimit-Reset` headers.
 *
 * The API keeps separate limits (without a key per IP address, with a key per account, and a
 * stricter one for starting and restarting sessions), so the values describe the limit of the
 * request they came from. When a request is refused with 429, prefer {@link OctaApiError.retryAfter}: a
 * per-session cooldown can demand a longer wait than the window reset.
 */
export interface RateLimit {
  /** Requests allowed per window */
  limit?: number
  /** Requests left in the current window */
  remaining?: number
  /** Seconds until the current window resets */
  reset?: number
}

export interface OctaApiErrorDetails {
  /** Machine-readable error code from the response body, if any */
  code?: string
  /** Value of the `X-Request-Id` response header, if present */
  requestId?: string
  /** Parsed response body (`{ message }`) */
  body?: unknown
  /** Seconds to wait before retrying, from the `Retry-After` header */
  retryAfter?: number
  /** Rate limit state from the `RateLimit-*` headers of this response */
  rateLimit?: RateLimit
}

/** An HTTP 4xx/5xx response from the API. Use the subclasses to branch on the kind of failure. */
export class OctaApiError extends OctaError {
  override readonly name: string = 'OctaApiError'
  declare readonly code?: string
  declare readonly requestId?: string
  declare readonly body?: unknown
  declare readonly retryAfter?: number
  declare readonly rateLimit?: RateLimit

  constructor(
    message: string,
    readonly status: number,
    details: OctaApiErrorDetails = {},
  ) {
    super(message)
    if (details.code !== undefined) this.code = details.code
    if (details.requestId !== undefined) this.requestId = details.requestId
    if (details.body !== undefined) this.body = details.body
    if (details.retryAfter !== undefined) this.retryAfter = details.retryAfter
    if (details.rateLimit !== undefined) this.rateLimit = details.rateLimit
  }
}

/**
 * 401: the API key is missing, wrong or deleted. Create a key (`octa_ak_…`) in the OctaSpace
 * dashboard under Account → Credentials → API Keys.
 */
export class OctaAuthenticationError extends OctaApiError {
  override readonly name: string = 'OctaAuthenticationError'
}

/** 403: access denied. */
export class OctaPermissionError extends OctaApiError {
  override readonly name: string = 'OctaPermissionError'
}

/**
 * 404: the resource does not exist. For a session this also means it has stopped: the API only
 * reports running sessions.
 */
export class OctaNotFoundError extends OctaApiError {
  override readonly name: string = 'OctaNotFoundError'
}

/**
 * 400 or 422: the request was rejected as invalid; `message` says why
 * (for example `tail must be 1..1000` or `Invalid node number`).
 */
export class OctaValidationError extends OctaApiError {
  override readonly name: string = 'OctaValidationError'
}

/** 409: the operation conflicts with the current state, e.g. a session that is still restarting. */
export class OctaConflictError extends OctaApiError {
  override readonly name: string = 'OctaConflictError'
}

/** 429: too many requests. Wait {@link OctaApiError.retryAfter} seconds before retrying. */
export class OctaRateLimitError extends OctaApiError {
  override readonly name: string = 'OctaRateLimitError'
}

/** 5xx: the API failed to handle the request. */
export class OctaServerError extends OctaApiError {
  override readonly name: string = 'OctaServerError'
}

/**
 * 503: the service is temporarily unavailable (for example render or statistics). The request
 * itself was fine; retry later.
 */
export class OctaServiceUnavailableError extends OctaServerError {
  override readonly name: string = 'OctaServiceUnavailableError'
}

/**
 * Thrown by `sessions.waitReady()` when the session stops while it is starting, for example
 * because SSH could not be set up. Logs are available only while a session runs, so read them
 * with `sessions.logs()` before it stops.
 */
export class OctaSessionStoppedError extends OctaNotFoundError {
  override readonly name: string = 'OctaSessionStoppedError'
}
