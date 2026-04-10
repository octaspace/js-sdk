import type { App } from '../types/index.js'
import { BaseResource } from './base.js'
import { type RequestOverrides, withRequestOverrides } from './request-options.js'

export class AppsResource extends BaseResource {
  async list(request?: RequestOverrides): Promise<App[]> {
    const res = await this.request<App[]>(
      withRequestOverrides({ method: 'GET', path: '/apps' }, request),
    )
    return res.data
  }
}
