/**
 * Invoke a queryFn without providing a full QueryFunctionContext; only `signal` is passed, which
 * is all the queries read from it.
 */
export function callQueryFn(
  opts: { queryFn?: unknown },
  context: { signal?: AbortSignal } = {},
): Promise<unknown> {
  return (
    (opts.queryFn as ((ctx: { signal?: AbortSignal }) => Promise<unknown>) | undefined)?.(
      context,
    ) ?? Promise.resolve()
  )
}
