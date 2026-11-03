import type { OctaClient } from '@octaspace/sdk'
import { type QueryContext, requestFrom } from '../queryContext.js'
import { queryOptions } from '../queryOptions.js'

export const hostingKeys = {
  all: () => ['@octaspace', 'hosting'] as const,
  nodes: () => [...hostingKeys.all(), 'nodes'] as const,
}

/**
 * Nodes the account hosts. `setPrices()` is a mutation and is not wrapped; after it, invalidate
 * `hostingKeys.all()` (the new prices appear after replication, usually within seconds).
 */
export const hostingQueries = {
  nodes: (client: OctaClient) =>
    queryOptions({
      queryKey: hostingKeys.nodes(),
      queryFn: (ctx: QueryContext) => client.hosting.nodes(requestFrom(ctx)),
    }),
}
