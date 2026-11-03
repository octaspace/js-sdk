import {
  type GpuCurrentOptions,
  type GpuHistoryOptions,
  normalizeGpuHistoryOptions,
  type OctaClient,
} from '@octaspace/sdk'
import { type QueryContext, requestFrom } from '../queryContext.js'
import { queryOptions } from '../queryOptions.js'

export const statsKeys = {
  all: () => ['@octaspace', 'stats'] as const,
  gpuCurrent: (options: GpuCurrentOptions = {}) =>
    [...statsKeys.all(), 'gpu', 'current', { verified: options.verified }] as const,
  gpuHistory: (options: GpuHistoryOptions = {}) =>
    [...statsKeys.all(), 'gpu', 'history', normalizeGpuHistoryOptions(options)] as const,
  gpuLocations: () => [...statsKeys.all(), 'gpu', 'locations'] as const,
}

/** Public GPU market statistics; work without an API key. */
export const statsQueries = {
  gpuCurrent: (client: OctaClient, options: GpuCurrentOptions = {}) =>
    queryOptions({
      queryKey: statsKeys.gpuCurrent(options),
      queryFn: (ctx: QueryContext) => client.stats.gpuCurrent(options, requestFrom(ctx)),
    }),

  gpuHistory: (client: OctaClient, options: GpuHistoryOptions = {}) =>
    queryOptions({
      queryKey: statsKeys.gpuHistory(options),
      queryFn: (ctx: QueryContext) => client.stats.gpuHistory(options, requestFrom(ctx)),
    }),

  gpuLocations: (client: OctaClient) =>
    queryOptions({
      queryKey: statsKeys.gpuLocations(),
      queryFn: (ctx: QueryContext) => client.stats.gpuLocations(requestFrom(ctx)),
    }),
}
