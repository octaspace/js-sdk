/**
 * Framework-agnostic identity helper.
 *
 * Mirrors the queryOptions() helpers shipped by framework adapters
 * (@tanstack/react-query, @tanstack/vue-query, etc.), which are pure
 * identity functions used only for TypeScript type-narrowing.  By
 * defining it here we avoid a peer-dep on any specific framework adapter.
 */
export function queryOptions<T extends { queryKey: readonly unknown[] }>(options: T): T {
  return options
}
