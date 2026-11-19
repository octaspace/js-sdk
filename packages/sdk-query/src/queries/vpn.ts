import type { OctaClient } from '@octaspace/sdk'
import { type QueryContext, requestFrom } from '../queryContext.js'
import { queryOptions } from '../queryOptions.js'

export const vpnKeys = {
  all: () => ['@octaspace', 'vpn'] as const,
  list: () => [...vpnKeys.all(), 'list'] as const,
}

/** VPN node listing. Starts are mutations and are not wrapped: call `client.vpn.start()`. */
export const vpnQueries = {
  list: (client: OctaClient) =>
    queryOptions({
      queryKey: vpnKeys.list(),
      queryFn: (ctx: QueryContext) => client.vpn.list(requestFrom(ctx)),
    }),
}
