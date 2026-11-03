import type {
  AccountBalance,
  GpuCurrent,
  GpuCurrentOptions,
  GpuHistory,
  GpuHistoryOptions,
  GpuLocation,
  HostingNode,
  NetworkInfo,
  Session,
  SessionLogs,
  SessionLogsOptions,
} from '@octaspace/sdk'
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

/** Account balance (`client.accounts.balance()`). */
export function useBalance(options?: UseOctaRequestOptions<AccountBalance>) {
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

/** Public platform statistics (`client.network.info()`); no API key needed. */
export function useNetworkInfo(options?: UseOctaRequestOptions<NetworkInfo>) {
  const client = useOctaClient()
  return useOctaRequest((request) => client.network.info(request), [client], options)
}

/** Online nodes the account hosts (`client.hosting.nodes()`). */
export function useHostingNodes(options?: UseOctaRequestOptions<HostingNode[]>) {
  const client = useOctaClient()
  return useOctaRequest((request) => client.hosting.nodes(request), [client], options)
}

/** GPU market now (`client.stats.gpuCurrent()`); no API key needed. */
export function useGpuCurrent(
  statsOptions?: GpuCurrentOptions,
  options?: UseOctaRequestOptions<GpuCurrent>,
) {
  const client = useOctaClient()
  const verified = statsOptions?.verified
  return useOctaRequest(
    (request) => client.stats.gpuCurrent({ verified }, request),
    [client, verified],
    options,
  )
}

/** GPU market over time (`client.stats.gpuHistory()`); no API key needed. */
export function useGpuHistory(
  historyOptions?: GpuHistoryOptions,
  options?: UseOctaRequestOptions<GpuHistory>,
) {
  const client = useOctaClient()
  const { gpuName, verified, start, end, step } = historyOptions ?? {}
  const gpuNameKey = Array.isArray(gpuName) ? gpuName.join(',') : gpuName
  const startKey = start instanceof Date ? start.getTime() : start
  const endKey = end instanceof Date ? end.getTime() : end
  return useOctaRequest(
    (request) => client.stats.gpuHistory({ gpuName, verified, start, end, step }, request),
    [client, gpuNameKey, verified, startKey, endKey, step],
    options,
  )
}

/** GPUs by city and model (`client.stats.gpuLocations()`); no API key needed. */
export function useGpuLocations(options?: UseOctaRequestOptions<GpuLocation[]>) {
  const client = useOctaClient()
  return useOctaRequest((request) => client.stats.gpuLocations(request), [client], options)
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
