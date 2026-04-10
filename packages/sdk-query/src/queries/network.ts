import type { OctaClient } from '@octaspace/sdk'
import { queryOptions } from '../queryOptions.js'

export const networkKeys = {
  all: () => ['@octaspace', 'network'] as const,
  stats: () => [...networkKeys.all(), 'stats'] as const,
}

export const networkQueries = {
  stats: (client: OctaClient) =>
    queryOptions({
      queryKey: networkKeys.stats(),
      queryFn: () => client.network.get(),
    }),
}
