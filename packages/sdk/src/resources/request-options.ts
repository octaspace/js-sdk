import type { RequestOptions as TransportRequestOptions } from '../transport/types.js'

export interface RequestOverrides {
  /** Abort an in-flight request */
  signal?: TransportRequestOptions['signal']
  /** Override retry count for this request */
  retries?: TransportRequestOptions['retries']
}

export function withRequestOverrides<T extends object>(base: T, request?: RequestOverrides): T {
  return {
    ...base,
    ...(request?.signal !== undefined && { signal: request.signal }),
    ...(request?.retries !== undefined && { retries: request.retries }),
  }
}
