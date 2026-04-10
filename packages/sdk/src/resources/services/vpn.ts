import type { StartVpnOptions, StartVpnResult, VpnNode } from '../../types/index.js'
import { BaseResource } from '../base.js'

export class VpnService extends BaseResource {
  async available(): Promise<VpnNode[]> {
    const res = await this.request<VpnNode[]>({ method: 'GET', path: '/services/vpn' })
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
