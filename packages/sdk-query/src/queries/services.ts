import type { OctaClient } from '@octaspace/sdk'
import { queryOptions } from '../queryOptions.js'

export const mrKeys = {
  all: () => ['@octaspace', 'services', 'mr'] as const,
  available: () => [...mrKeys.all(), 'available'] as const,
}

export const mrQueries = {
  available: (client: OctaClient) =>
    queryOptions({
      queryKey: mrKeys.available(),
      queryFn: () => client.services.mr.available(),
    }),
}

export const renderKeys = {
  all: () => ['@octaspace', 'services', 'render'] as const,
  available: () => [...renderKeys.all(), 'available'] as const,
}

export const renderQueries = {
  available: (client: OctaClient) =>
    queryOptions({
      queryKey: renderKeys.available(),
      queryFn: () => client.services.render.available(),
    }),
}

export const vpnKeys = {
  all: () => ['@octaspace', 'services', 'vpn'] as const,
  available: () => [...vpnKeys.all(), 'available'] as const,
}

export const vpnQueries = {
  available: (client: OctaClient) =>
    queryOptions({
      queryKey: vpnKeys.available(),
      queryFn: () => client.services.vpn.available(),
    }),
}

export const serviceSessionKeys = {
  all: (uuid: string) => ['@octaspace', 'services', 'session', uuid] as const,
  info: (uuid: string) => [...serviceSessionKeys.all(uuid), 'info'] as const,
  logs: (uuid: string) => [...serviceSessionKeys.all(uuid), 'logs'] as const,
}

export const serviceSessionQueries = {
  info: (client: OctaClient, uuid: string) =>
    queryOptions({
      queryKey: serviceSessionKeys.info(uuid),
      queryFn: () => client.services.session(uuid).info(),
    }),

  logs: (client: OctaClient, uuid: string) =>
    queryOptions({
      queryKey: serviceSessionKeys.logs(uuid),
      queryFn: () => client.services.session(uuid).logs(),
    }),
}
