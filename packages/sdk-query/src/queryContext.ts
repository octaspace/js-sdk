import type { RequestOverrides } from '@octaspace/sdk'

/** The part of TanStack's `QueryFunctionContext` the queries use. */
export interface QueryContext {
  signal?: AbortSignal
}

/** Forwards the query's abort signal to the SDK request. */
export function requestFrom({ signal }: QueryContext = {}): RequestOverrides | undefined {
  return signal ? { signal } : undefined
}
