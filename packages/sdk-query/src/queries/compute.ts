import type { OctaClient } from '@octaspace/sdk'
import { type QueryContext, requestFrom } from '../queryContext.js'
import { queryOptions } from '../queryOptions.js'

export const computeKeys = {
  all: () => ['@octaspace', 'compute'] as const,
  list: () => [...computeKeys.all(), 'list'] as const,
  apps: () => [...computeKeys.all(), 'apps'] as const,
}

/**
 * Compute machine listing and apps. Starts and restarts are mutations and are not wrapped: call
 * `client.compute.start()` / `startBatch()` / `restart()` from your mutation function.
 */
export const computeQueries = {
  list: (client: OctaClient) =>
    queryOptions({
      queryKey: computeKeys.list(),
      queryFn: (ctx: QueryContext) => client.compute.list(requestFrom(ctx)),
    }),
  /**
   * Apps to start a session from. With an API key the list includes the account's own apps, so
   * invalidate `computeKeys.apps()` when the client's key changes.
   */
  apps: (client: OctaClient) =>
    queryOptions({
      queryKey: computeKeys.apps(),
      queryFn: (ctx: QueryContext) => client.compute.apps(requestFrom(ctx)),
    }),
}
