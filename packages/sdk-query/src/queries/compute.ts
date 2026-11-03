import type { OctaClient } from '@octaspace/sdk'
import { type QueryContext, requestFrom } from '../queryContext.js'
import { queryOptions } from '../queryOptions.js'

export const computeKeys = {
  all: () => ['@octaspace', 'compute'] as const,
  list: () => [...computeKeys.all(), 'list'] as const,
}

/**
 * Compute machine listing. Starts and restarts are mutations and are not wrapped: call
 * `client.compute.start()` / `startBatch()` / `restart()` from your mutation function.
 */
export const computeQueries = {
  list: (client: OctaClient) =>
    queryOptions({
      queryKey: computeKeys.list(),
      queryFn: (ctx: QueryContext) => client.compute.list(requestFrom(ctx)),
    }),
}
