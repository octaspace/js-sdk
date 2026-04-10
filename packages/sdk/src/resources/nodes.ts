import type { Node, NodeDetail, UpdateNodePricesOptions } from '../types/index.js'
import { BaseResource } from './base.js'
import { type RequestOverrides, withRequestOverrides } from './request-options.js'

export class NodesResource extends BaseResource {
  async list(request?: RequestOverrides): Promise<Node[]> {
    const res = await this.request<Node[]>(
      withRequestOverrides({ method: 'GET', path: '/nodes' }, request),
    )
    return res.data
  }

  async get(id: string | number, request?: RequestOverrides): Promise<NodeDetail> {
    const res = await this.request<NodeDetail>(
      withRequestOverrides({ method: 'GET', path: `/nodes/${id}` }, request),
    )
    return res.data
  }

  async downloadIdent(id: string | number, request?: RequestOverrides): Promise<Blob> {
    const res = await this.request<Blob>(
      withRequestOverrides(
        { method: 'GET', path: `/nodes/${id}/ident`, responseType: 'blob' },
        request,
      ),
    )
    return res.data
  }

  async downloadLogs(id: string | number, request?: RequestOverrides): Promise<Blob> {
    const res = await this.request<Blob>(
      withRequestOverrides(
        { method: 'GET', path: `/nodes/${id}/logs`, responseType: 'blob' },
        request,
      ),
    )
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
