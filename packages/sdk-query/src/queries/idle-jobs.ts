import type { OctaClient } from '@octaspace/sdk'
import { queryOptions } from '../queryOptions.js'

export const idleJobKeys = {
  all: () => ['@octaspace', 'idleJobs'] as const,
  detail: (nodeId: string | number, jobId: string | number) =>
    [...idleJobKeys.all(), 'detail', nodeId, jobId] as const,
  logs: (nodeId: string | number, jobId: string | number) =>
    [...idleJobKeys.all(), 'logs', nodeId, jobId] as const,
}

export const idleJobQueries = {
  detail: (client: OctaClient, nodeId: string | number, jobId: string | number) =>
    queryOptions({
      queryKey: idleJobKeys.detail(nodeId, jobId),
      queryFn: () => client.idleJobs.get(nodeId, jobId),
    }),

  logs: (client: OctaClient, nodeId: string | number, jobId: string | number) =>
    queryOptions({
      queryKey: idleJobKeys.logs(nodeId, jobId),
      queryFn: () => client.idleJobs.logs(nodeId, jobId),
    }),
}
