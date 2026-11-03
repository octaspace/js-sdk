import type { OctaClient } from '@octaspace/sdk'
import { queryOptions } from '../queryOptions.js'

export const renderKeys = {
  all: () => ['@octaspace', 'render'] as const,
  list: () => [...renderKeys.all(), 'list'] as const,
}

/** Render node listing. Starts are mutations and are not wrapped. */
export const renderQueries = {
  list: (client: OctaClient) =>
    queryOptions({
      queryKey: renderKeys.list(),
      queryFn: ({ signal }: { signal?: AbortSignal }) =>
        client.render.list(signal ? { signal } : undefined),
    }),
}
