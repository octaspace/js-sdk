export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE'
export type ResponseType = 'json' | 'blob' | 'text'

export interface RequestOptions {
  method: HttpMethod
  path: string
  query?: Record<string, string | number | boolean | undefined>
  body?: unknown
  responseType?: ResponseType
  signal?: AbortSignal
  /** Skip Authorization header (e.g. for public endpoints) */
  skipAuth?: boolean
  /** Override per-request retry count */
  retries?: number
}

export interface ApiResponse<T> {
  data: T
  status: number
  headers: Headers
  requestId?: string
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
