import type { NetworkInfo } from '../types/network.js'
import { BaseResource } from './base.js'
import { type RequestOverrides, withRequestOverrides } from './request-options.js'

/** Platform statistics; no API key needed. */
export class NetworkResource extends BaseResource {
  /** Platform statistics snapshot (`GET /network`). */
  async info(request?: RequestOverrides): Promise<NetworkInfo> {
    const res = await this.request<NetworkInfo>(
      withRequestOverrides({ method: 'GET', path: '/network', auth: 'none' }, request),
    )
    return res.data
  }
}
