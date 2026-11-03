import type { GpuCurrentOptions, GpuHistoryOptions, OctaClient } from '@octaspace/sdk'
import { type QueryContext, requestFrom } from '../queryContext.js'
import { queryOptions } from '../queryOptions.js'

function seconds(value: number | Date | undefined): number | undefined {
  return value instanceof Date ? Math.floor(value.getTime() / 1000) : value
}

/** Normalizes history options so equal requests get equal keys. */
function historyKey(options: GpuHistoryOptions) {
  const gpuName = Array.isArray(options.gpuName) ? options.gpuName.join(',') : options.gpuName
  return {
    gpuName,
    verified: options.verified,
    start: seconds(options.start),
    end: seconds(options.end),
    step: options.step,
  }
}

export const statsKeys = {
  all: () => ['@octaspace', 'stats'] as const,
  gpuCurrent: (options: GpuCurrentOptions = {}) =>
    [...statsKeys.all(), 'gpu', 'current', { verified: options.verified }] as const,
  gpuHistory: (options: GpuHistoryOptions = {}) =>
    [...statsKeys.all(), 'gpu', 'history', historyKey(options)] as const,
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
