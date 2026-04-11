import type { OctaClient } from '@octaspace/sdk'
import { queryOptions } from '../queryOptions.js'

export const nodeKeys = {
  all: () => ['@octaspace', 'nodes'] as const,
  list: () => [...nodeKeys.all(), 'list'] as const,
  detail: (id: string | number) => [...nodeKeys.all(), 'detail', id] as const,
}

export const nodeQueries = {
  list: (client: OctaClient) =>
    queryOptions({
      queryKey: nodeKeys.list(),
      queryFn: () => client.nodes.list(),
    }),

  detail: (client: OctaClient, id: string | number) =>
    queryOptions({
      queryKey: nodeKeys.detail(id),
      queryFn: () => client.nodes.get(id),
    }),
}
