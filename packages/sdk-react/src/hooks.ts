import type {
  ListSessionsOptions,
  RequestOverrides,
  ServiceInfo,
  SessionLogs,
} from '@octaspace/sdk'
import { useOctaClient } from './context.js'
import { type UseOctaRequestOptions, useOctaRequest } from './useOctaRequest.js'

export type { UseOctaRequestOptions, UseOctaRequestResult } from './useOctaRequest.js'

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
    {
      enabled: id !== null && id !== undefined && (options?.enabled ?? true),
      initialData: options?.initialData,
    },
  )
}

export function useMrAvailable(
  options?: UseOctaRequestOptions<
    Awaited<ReturnType<ReturnType<typeof useOctaClient>['services']['mr']['available']>>
  >,
) {
  const client = useOctaClient()
  return useOctaRequest((request) => client.services.mr.available(request), [client], options)
}

export function useRenderAvailable(
  options?: UseOctaRequestOptions<
    Awaited<ReturnType<ReturnType<typeof useOctaClient>['services']['render']['available']>>
  >,
) {
  const client = useOctaClient()
  return useOctaRequest((request) => client.services.render.available(request), [client], options)
}

export function useVpnAvailable(
  options?: UseOctaRequestOptions<
    Awaited<ReturnType<ReturnType<typeof useOctaClient>['services']['vpn']['available']>>
  >,
) {
  const client = useOctaClient()
  return useOctaRequest((request) => client.services.vpn.available(request), [client], options)
}

export function useServiceSessionInfo(
  uuid: string | null | undefined,
  options?: UseOctaRequestOptions<ServiceInfo>,
) {
  const client = useOctaClient()
  return useOctaRequest(
    uuid ? (request) => client.services.session(uuid).info(request) : null,
    [client, uuid],
    {
      enabled: Boolean(uuid) && (options?.enabled ?? true),
      initialData: options?.initialData,
    },
  )
}

export function useServiceSessionLogs(
  uuid: string | null | undefined,
  options?: UseOctaRequestOptions<SessionLogs>,
) {
  const client = useOctaClient()
  return useOctaRequest(
    uuid ? (request) => client.services.session(uuid).logs(request) : null,
    [client, uuid],
    {
      enabled: Boolean(uuid) && (options?.enabled ?? true),
      initialData: options?.initialData,
    },
  )
}

export function useSessions(
  listOptions?: ListSessionsOptions,
  options?: UseOctaRequestOptions<
    Awaited<ReturnType<ReturnType<typeof useOctaClient>['sessions']['list']>>
  >,
) {
  const client = useOctaClient()
  return useOctaRequest(
    (request: RequestOverrides) => client.sessions.list(listOptions ?? {}, request),
    [client, listOptions?.recent],
    options,
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
    {
      enabled: enabled && (options?.enabled ?? true),
      initialData: options?.initialData,
    },
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
    {
      enabled: enabled && (options?.enabled ?? true),
      initialData: options?.initialData,
    },
  )
}
