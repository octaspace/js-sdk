import type { RateLimit } from '../errors/api.js'

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE'

/**
 * How a request authenticates:
 * - `required` (default): sends `Authorization: Bearer <apiKey>`; fails before `fetch` without a key.
 * - `optional`: sends the key when the client has one (fresher data), otherwise goes anonymous.
 * - `none`: never sends the key (public endpoints).
 */
export type AuthMode = 'required' | 'optional' | 'none'

export interface RequestOptions {
  method: HttpMethod
  path: string
  query?: Record<string, string | number | boolean | undefined>
  body?: unknown
  signal?: AbortSignal
  /** Authentication mode (default: `required`) */
  auth?: AuthMode
  /** Override per-request retry count */
  retries?: number
  /**
   * Allow retries for a non-GET request that the API documents as idempotent
   * (e.g. `POST /services/{uuid}/stop`). Never set it for starts or restarts.
   */
  idempotent?: boolean
}

export interface ApiResponse<T> {
  data: T
  status: number
  headers: Headers
  requestId?: string
  rateLimit?: RateLimit
}

export interface RequestContext {
  method: HttpMethod
  url: string
  headers: Headers
  body?: unknown
  attempt: number
}

export interface ResponseContext {
  request: RequestContext
  status: number
  headers: Headers
  durationMs: number
}
