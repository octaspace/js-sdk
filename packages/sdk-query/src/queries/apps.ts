import type { OctaClient } from '@octaspace/sdk'
import { queryOptions } from '../queryOptions.js'

export const appKeys = {
  all: () => ['@octaspace', 'apps'] as const,
  list: () => [...appKeys.all(), 'list'] as const,
}

export const appQueries = {
  list: (client: OctaClient) =>
    queryOptions({
      queryKey: appKeys.list(),
      queryFn: () => client.apps.list(),
    }),
}
