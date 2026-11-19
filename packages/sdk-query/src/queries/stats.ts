import {
  type GpuCurrentOptions,
  type GpuHistoryOptions,
  type MiningOptions,
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
  mining: (options: MiningOptions = {}) =>
    [...statsKeys.all(), 'mining', { role: options.role, days: options.days }] as const,
}

/** GPU market and mining statistics; no API key needed. */
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

  mining: (client: OctaClient, options: MiningOptions = {}) =>
    queryOptions({
      queryKey: statsKeys.mining(options),
      queryFn: (ctx: QueryContext) => client.stats.mining(options, requestFrom(ctx)),
    }),
}
