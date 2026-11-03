import type { BatchResult, StartResult } from '../types/common.js'
import type { RenderBatchItem, RenderMachine, RenderStartParams } from '../types/render.js'
import { BaseResource } from './base.js'
import { normalizeMachines, withBatchIds } from './machines.js'
import { type RequestOverrides, withRequestOverrides } from './request-options.js'

/** Render nodes: listing and start (single and batch). */
export class RenderResource extends BaseResource {
  /**
   * Nodes available for render (`GET /services/render`). Works without an API key; with a key
   * the listing is fresher.
   */
  async list(request?: RequestOverrides): Promise<RenderMachine[]> {
    const res = await this.request<RenderMachine[]>(
      withRequestOverrides({ method: 'GET', path: '/services/render', auth: 'optional' }, request),
    )
    return normalizeMachines(res.data)
  }

  /**
   * Rents a node as a render node (`POST /services/render` with an object → 201), billed by the
   * hour until stopped. When render is temporarily unavailable this throws an
   * `OctaServiceUnavailableError` (503). Never retried automatically.
   */
  async start(params: RenderStartParams, request?: RequestOverrides): Promise<StartResult> {
    const res = await this.request<StartResult>(
      withRequestOverrides(
        {
          method: 'POST',
          path: '/services/render',
          body: { node_number: params.node_number },
        },
        request,
      ),
    )
    return res.data
  }

  /**
   * Rents several render nodes at once (`POST /services/render` with an array → 200). Unlike
   * {@link start}, a temporarily unavailable service is reported per item (`status: 1`,
   * `reason: "Service is temporarily unavailable"`), not as an HTTP 503.
   */
  async startBatch(
    items: readonly RenderBatchItem[],
    request?: RequestOverrides,
  ): Promise<BatchResult[]> {
    const body = withBatchIds(items).map((item) => ({ id: item.id, node_number: item.node_number }))
    const res = await this.request<BatchResult[]>(
      withRequestOverrides({ method: 'POST', path: '/services/render', body }, request),
    )
    return res.data
  }
}
