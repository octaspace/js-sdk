import type { Node, NodeDetail, UpdateNodePricesOptions } from '../types/index.js'
import { BaseResource } from './base.js'

export class NodesResource extends BaseResource {
  async list(): Promise<Node[]> {
    const res = await this.request<Node[]>({ method: 'GET', path: '/nodes' })
    return res.data
  }

  async get(id: string | number): Promise<NodeDetail> {
    const res = await this.request<NodeDetail>({ method: 'GET', path: `/nodes/${id}` })
    return res.data
  }

  async downloadIdent(id: string | number): Promise<Blob> {
    const res = await this.request<Blob>({
      method: 'GET',
      path: `/nodes/${id}/ident`,
      responseType: 'blob',
    })
    return res.data
  }

  async downloadLogs(id: string | number): Promise<Blob> {
    const res = await this.request<Blob>({
      method: 'GET',
      path: `/nodes/${id}/logs`,
      responseType: 'blob',
    })
    return res.data
  }

  async updatePrices(id: string | number, prices: UpdateNodePricesOptions): Promise<void> {
    await this.request<unknown>({
      method: 'PATCH',
      path: `/nodes/${id}/prices`,
      body: prices,
    })
  }

  async reboot(id: string | number): Promise<void> {
    await this.request<unknown>({ method: 'GET', path: `/nodes/${id}/reboot` })
  }
}
