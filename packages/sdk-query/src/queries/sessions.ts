import type { ListSessionsOptions, OctaClient } from '@octaspace/sdk'
import { queryOptions } from '../queryOptions.js'

export const sessionKeys = {
  all: () => ['@octaspace', 'sessions'] as const,
  list: (options?: ListSessionsOptions) => [...sessionKeys.all(), 'list', options ?? {}] as const,
}

export const sessionQueries = {
  list: (client: OctaClient, options?: ListSessionsOptions) =>
    queryOptions({
      queryKey: sessionKeys.list(options),
      queryFn: () => client.sessions.list(options),
    }),
}
