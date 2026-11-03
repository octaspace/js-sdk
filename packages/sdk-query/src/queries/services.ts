import type { OctaClient } from '@octaspace/sdk'
import { queryOptions } from '../queryOptions.js'

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
