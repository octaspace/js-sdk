import {
  type AccountBalance,
  type ComputeApp,
  type ComputeMachine,
  type GpuCurrent,
  type GpuCurrentOptions,
  type GpuHistory,
  type GpuHistoryOptions,
  type GpuLocation,
  type HostingNode,
  type MiningOptions,
  type MiningUsage,
  type NetworkHistory,
  type NetworkHistoryOptions,
  type NetworkInfo,
  normalizeGpuHistoryOptions,
  normalizeNetworkHistoryOptions,
  type RenderMachine,
  type Session,
  type SessionLogs,
  type SessionLogsOptions,
  type VpnMachine,
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

/** Platform statistics (`client.network.info()`); no API key needed. */
export function useNetworkInfo(options?: UseOctaRequestOptions<NetworkInfo>) {
  const client = useOctaClient()
  return useOctaRequest((request) => client.network.info(request), [client], options)
}

/** Platform statistics over time (`client.network.history()`); no API key needed. */
export function useNetworkHistory(
  historyOptions?: NetworkHistoryOptions,
  options?: UseOctaRequestOptions<NetworkHistory>,
) {
  const client = useOctaClient()
  const { start, end, step } = normalizeNetworkHistoryOptions(historyOptions)
  return useOctaRequest(
    (request) => client.network.history({ start, end, step }, request),
    [client, start, end, step],
    options,
  )
}

/** Online nodes the account hosts (`client.hosting.nodes()`). */
export function useHostingNodes(options?: UseOctaRequestOptions<HostingNode[]>) {
  const client = useOctaClient()
  return useOctaRequest((request) => client.hosting.nodes(request), [client], options)
}

/** One online node of the account (`client.hosting.get(number)`); skipped while `number` is empty. */
export function useHostingNode(
  number: string | null | undefined,
  options?: UseOctaRequestOptions<HostingNode>,
) {
  const client = useOctaClient()
  return useOctaRequest(
    number ? (request) => client.hosting.get(number, request) : null,
    [client, number],
    whenReady(Boolean(number), options),
  )
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
  const { gpuName, verified, start, end, step } = normalizeGpuHistoryOptions(historyOptions)
  return useOctaRequest(
    (request) => client.stats.gpuHistory({ gpuName, verified, start, end, step }, request),
    [client, gpuName, verified, start, end, step],
    options,
  )
}

/** GPUs by city and model (`client.stats.gpuLocations()`); no API key needed. */
export function useGpuLocations(options?: UseOctaRequestOptions<GpuLocation[]>) {
  const client = useOctaClient()
  return useOctaRequest((request) => client.stats.gpuLocations(request), [client], options)
}

/** Mining on the platform (`client.stats.mining()`); no API key needed. */
export function useMiningStats(
  miningOptions?: MiningOptions,
  options?: UseOctaRequestOptions<MiningUsage>,
) {
  const client = useOctaClient()
  const role = miningOptions?.role
  const days = miningOptions?.days
  return useOctaRequest(
    (request) => client.stats.mining({ role, days }, request),
    [client, role, days],
    options,
  )
}

/** Compute machines available for rent (`client.compute.list()`). */
export function useComputeMachines(options?: UseOctaRequestOptions<ComputeMachine[]>) {
  const client = useOctaClient()
  return useOctaRequest((request) => client.compute.list(request), [client], options)
}

/** Apps to start a compute session from (`client.compute.apps()`). */
export function useComputeApps(options?: UseOctaRequestOptions<ComputeApp[]>) {
  const client = useOctaClient()
  return useOctaRequest((request) => client.compute.apps(request), [client], options)
}

/** Nodes offered for VPN (`client.vpn.list()`). */
export function useVpnMachines(options?: UseOctaRequestOptions<VpnMachine[]>) {
  const client = useOctaClient()
  return useOctaRequest((request) => client.vpn.list(request), [client], options)
}

/** Render nodes available for rent (`client.render.list()`). */
export function useRenderMachines(options?: UseOctaRequestOptions<RenderMachine[]>) {
  const client = useOctaClient()
  return useOctaRequest((request) => client.render.list(request), [client], options)
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
