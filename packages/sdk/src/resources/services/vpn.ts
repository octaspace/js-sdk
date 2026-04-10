import type { StartVpnOptions, StartVpnResult, VpnNode } from '../../types/index.js'
import { BaseResource } from '../base.js'
import { type RequestOverrides, withRequestOverrides } from '../request-options.js'

export class VpnService extends BaseResource {
  async available(request?: RequestOverrides): Promise<VpnNode[]> {
    const res = await this.request<VpnNode[]>(
      withRequestOverrides({ method: 'GET', path: '/services/vpn' }, request),
    )
    return res.data
  }

  async start(options: StartVpnOptions): Promise<StartVpnResult> {
    const res = await this.request<StartVpnResult>({
      method: 'POST',
      path: '/services/vpn',
      body: options,
    })
    return res.data
  }
}
