import {
  type NetworkHistoryOptions,
  normalizeNetworkHistoryOptions,
  type OctaClient,
} from '@octaspace/sdk'
import { type QueryContext, requestFrom } from '../queryContext.js'
import { queryOptions } from '../queryOptions.js'

export const networkKeys = {
  all: () => ['@octaspace', 'network'] as const,
  info: () => [...networkKeys.all(), 'info'] as const,
  history: (options: NetworkHistoryOptions = {}) =>
    [...networkKeys.all(), 'history', normalizeNetworkHistoryOptions(options)] as const,
}

/** Platform statistics; no API key needed. */
export const networkQueries = {
  info: (client: OctaClient) =>
    queryOptions({
      queryKey: networkKeys.info(),
      queryFn: (ctx: QueryContext) => client.network.info(requestFrom(ctx)),
    }),

  history: (client: OctaClient, options: NetworkHistoryOptions = {}) =>
    queryOptions({
      queryKey: networkKeys.history(options),
      queryFn: (ctx: QueryContext) => client.network.history(options, requestFrom(ctx)),
    }),
}
