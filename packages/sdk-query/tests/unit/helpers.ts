/** Invoke a queryFn without providing a full QueryFunctionContext. */
export function callQueryFn(opts: { queryFn?: unknown }): Promise<unknown> {
  return (opts.queryFn as (() => Promise<unknown>) | undefined)?.() ?? Promise.resolve()
}
