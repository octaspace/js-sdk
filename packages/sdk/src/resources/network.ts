import type { NetworkStats } from '../types/index.js'
import { BaseResource } from './base.js'
import { type RequestOverrides, withRequestOverrides } from './request-options.js'

export class NetworkResource extends BaseResource {
  async get(request?: RequestOverrides): Promise<NetworkStats> {
    const res = await this.request<NetworkStats>(
      withRequestOverrides({ method: 'GET', path: '/network', skipAuth: true }, request),
    )
    return res.data
  }
}
