import type { Session, SessionLogs, SessionLogsOptions } from '@octaspace/sdk'
import { useOctaClient } from './context.js'
import { type UseOctaRequestOptions, useOctaRequest } from './useOctaRequest.js'

export type { UseOctaRequestOptions, UseOctaRequestResult } from './useOctaRequest.js'

/** Options of a hook whose request needs inputs: it only runs when they are present. */
function whenReady<TData>(
  ready: boolean,
  options: UseOctaRequestOptions<TData> | undefined,
): UseOctaRequestOptions<TData> {
  return { ...options, enabled: ready && (options?.enabled ?? true) }
}

export function useAccount(
  options?: UseOctaRequestOptions<
    Awaited<ReturnType<ReturnType<typeof useOctaClient>['accounts']['get']>>
  >,
) {
  const client = useOctaClient()
  return useOctaRequest((request) => client.accounts.get(request), [client], options)
}

export function useBalance(
  options?: UseOctaRequestOptions<
    Awaited<ReturnType<ReturnType<typeof useOctaClient>['accounts']['balance']>>
  >,
) {
  const client = useOctaClient()
  return useOctaRequest((request) => client.accounts.balance(request), [client], options)
}

export function useApps(
  options?: UseOctaRequestOptions<
    Awaited<ReturnType<ReturnType<typeof useOctaClient>['apps']['list']>>
  >,
) {
  const client = useOctaClient()
  return useOctaRequest((request) => client.apps.list(request), [client], options)
}

export function useNetworkStats(
  options?: UseOctaRequestOptions<
    Awaited<ReturnType<ReturnType<typeof useOctaClient>['network']['get']>>
  >,
) {
  const client = useOctaClient()
  return useOctaRequest((request) => client.network.get(request), [client], options)
}

export function useNodes(
  options?: UseOctaRequestOptions<
    Awaited<ReturnType<ReturnType<typeof useOctaClient>['nodes']['list']>>
  >,
) {
  const client = useOctaClient()
  return useOctaRequest((request) => client.nodes.list(request), [client], options)
}

export function useNode(
  id: string | number | null | undefined,
  options?: UseOctaRequestOptions<
    Awaited<ReturnType<ReturnType<typeof useOctaClient>['nodes']['get']>>
  >,
) {
  const client = useOctaClient()
  return useOctaRequest(
    id === null || id === undefined ? null : (request) => client.nodes.get(id, request),
    [client, id],
    whenReady(id !== null && id !== undefined, options),
  )
}

/** Compute machines available for rent (`client.compute.list()`). */
export function useComputeMachines(
  options?: UseOctaRequestOptions<
    Awaited<ReturnType<ReturnType<typeof useOctaClient>['compute']['list']>>
  >,
) {
  const client = useOctaClient()
  return useOctaRequest((request) => client.compute.list(request), [client], options)
}

/** Render nodes available for rent (`client.render.list()`). */
export function useRenderMachines(
  options?: UseOctaRequestOptions<
    Awaited<ReturnType<ReturnType<typeof useOctaClient>['render']['list']>>
  >,
) {
  const client = useOctaClient()
  return useOctaRequest((request) => client.render.list(request), [client], options)
}

export function useVpnAvailable(
  options?: UseOctaRequestOptions<
    Awaited<ReturnType<ReturnType<typeof useOctaClient>['services']['vpn']['available']>>
  >,
) {
  const client = useOctaClient()
  return useOctaRequest((request) => client.services.vpn.available(request), [client], options)
}

/** Running sessions of the account (`client.sessions.list()`). */
export function useSessions(options?: UseOctaRequestOptions<Session[]>) {
  const client = useOctaClient()
  return useOctaRequest((request) => client.sessions.list(request), [client], options)
}

/**
 * A running session (`client.sessions.get(uuid)`); skipped while `uuid` is empty. To follow a
 * starting session, pass `refetchIntervalMs` and stop when `data.status === 'ready'`. A stopped
 * session yields an `OctaNotFoundError` in `error`.
 */
export function useSession(
  uuid: string | null | undefined,
  options?: UseOctaRequestOptions<Session>,
) {
  const client = useOctaClient()
  return useOctaRequest(
    uuid ? (request) => client.sessions.get(uuid, request) : null,
    [client, uuid],
    whenReady(Boolean(uuid), options),
  )
}

/** Logs of a running compute session (`client.sessions.logs(uuid, { tail })`). */
export function useSessionLogs(
  uuid: string | null | undefined,
  logsOptions?: SessionLogsOptions,
  options?: UseOctaRequestOptions<SessionLogs>,
) {
  const client = useOctaClient()
  const tail = logsOptions?.tail
  return useOctaRequest(
    uuid ? (request) => client.sessions.logs(uuid, { tail }, request) : null,
    [client, uuid, tail],
    whenReady(Boolean(uuid), options),
  )
}

export function useIdleJob(
  nodeId: string | number | null | undefined,
  jobId: string | number | null | undefined,
  options?: UseOctaRequestOptions<
    Awaited<ReturnType<ReturnType<typeof useOctaClient>['idleJobs']['get']>>
  >,
) {
  const client = useOctaClient()
  const enabled = nodeId !== null && nodeId !== undefined && jobId !== null && jobId !== undefined

  return useOctaRequest(
    enabled ? (request) => client.idleJobs.get(nodeId, jobId, request) : null,
    [client, nodeId, jobId],
    whenReady(enabled, options),
  )
}

export function useIdleJobLogs(
  nodeId: string | number | null | undefined,
  jobId: string | number | null | undefined,
  options?: UseOctaRequestOptions<string>,
) {
  const client = useOctaClient()
  const enabled = nodeId !== null && nodeId !== undefined && jobId !== null && jobId !== undefined

  return useOctaRequest(
    enabled ? (request) => client.idleJobs.logs(nodeId, jobId, request) : null,
    [client, nodeId, jobId],
    whenReady(enabled, options),
  )
}
