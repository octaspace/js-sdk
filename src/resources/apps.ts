import type { App } from '../types/index.js'
import { BaseResource } from './base.js'

export class AppsResource extends BaseResource {
  async list(): Promise<App[]> {
    const res = await this.request<App[]>({ method: 'GET', path: '/apps' })
    return res.data
  }
}
