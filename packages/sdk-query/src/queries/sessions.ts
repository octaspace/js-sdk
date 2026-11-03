import type { OctaClient, SessionLogsOptions } from '@octaspace/sdk'
import { queryOptions } from '../queryOptions.js'

type QueryContext = { signal?: AbortSignal }
const overrides = ({ signal }: QueryContext) => (signal ? { signal } : undefined)

export const sessionKeys = {
  all: () => ['@octaspace', 'sessions'] as const,
  list: () => [...sessionKeys.all(), 'list'] as const,
  detail: (uuid: string) => [...sessionKeys.all(), 'detail', uuid] as const,
  logs: (uuid: string, options: SessionLogsOptions = {}) =>
    [...sessionKeys.all(), 'logs', uuid, { tail: options.tail }] as const,
}

/**
 * Running sessions. `stop()` and `compute.restart()` are mutations and are not wrapped; after one,
 * invalidate `sessionKeys.all()`. A stopped session's `detail` query fails with
 * `OctaNotFoundError`; to follow a starting one, use `refetchInterval` until `status` is `ready`.
 */
export const sessionQueries = {
  list: (client: OctaClient) =>
    queryOptions({
      queryKey: sessionKeys.list(),
      queryFn: (ctx: QueryContext) => client.sessions.list(overrides(ctx)),
    }),

  detail: (client: OctaClient, uuid: string) =>
    queryOptions({
      queryKey: sessionKeys.detail(uuid),
      queryFn: (ctx: QueryContext) => client.sessions.get(uuid, overrides(ctx)),
    }),

  logs: (client: OctaClient, uuid: string, options: SessionLogsOptions = {}) =>
    queryOptions({
      queryKey: sessionKeys.logs(uuid, options),
      queryFn: (ctx: QueryContext) => client.sessions.logs(uuid, options, overrides(ctx)),
    }),
}
