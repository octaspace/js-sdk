import type { OctaClient } from '@octaspace/sdk'
import { type QueryContext, requestFrom } from '../queryContext.js'
import { queryOptions } from '../queryOptions.js'

export const networkKeys = {
  all: () => ['@octaspace', 'network'] as const,
  info: () => [...networkKeys.all(), 'info'] as const,
}

export const networkQueries = {
  info: (client: OctaClient) =>
    queryOptions({
      queryKey: networkKeys.info(),
      queryFn: (ctx: QueryContext) => client.network.info(requestFrom(ctx)),
    }),
}
