import type { NetworkStats } from '../types/index.js'
import { BaseResource } from './base.js'

export class NetworkResource extends BaseResource {
  async get(): Promise<NetworkStats> {
    const res = await this.request<NetworkStats>({
      method: 'GET',
      path: '/network',
      skipAuth: true,
    })
    return res.data
  }
}
