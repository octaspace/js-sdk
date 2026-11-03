import type { HostingNode, NodePrices } from '../types/hosting.js'
import { nullStrings } from '../utils/null-strings.js'
import { BaseResource } from './base.js'
import { pickDefined } from './machines.js'
import { type RequestOverrides, withRequestOverrides } from './request-options.js'

const PRICE_FIELDS = [
  'base',
  'storage',
  'traffic',
  'min_rent_minutes',
] as const satisfies readonly (keyof NodePrices)[]

/** Nodes the account hosts. */
export class HostingResource extends BaseResource {
  /**
   * Online nodes of the account with their state, hardware and prices (`GET /hosting/nodes`).
   * Offline nodes are not listed, and there is no per-node endpoint.
   */
  async nodes(request?: RequestOverrides): Promise<HostingNode[]> {
    const res = await this.request<HostingNode[]>(
      withRequestOverrides({ method: 'GET', path: '/hosting/nodes' }, request),
    )
    return nullStrings(res.data)
  }

  /**
   * Updates some prices of a node (`PATCH /hosting/nodes/{number}/prices` → 204). Only the fields
   * that are set are sent; at least one is required. Amounts are integer micro-USD (convert
   * dollars with `usdToMicroUsd()`); the API refuses other values with an `OctaValidationError`,
   * an unknown node with `OctaNotFoundError`.
   *
   * 204 means the prices are stored; listings (`hosting.nodes()`, `compute.list()`) show them
   * after replication, usually within a few seconds.
   */
  async setPrices(number: string, prices: NodePrices, request?: RequestOverrides): Promise<void> {
    const body = pickDefined(prices, PRICE_FIELDS)
    if (Object.keys(body).length === 0) {
      throw new TypeError(
        'setPrices needs at least one of base, storage, traffic, min_rent_minutes',
      )
    }
    for (const [field, value] of Object.entries(body)) {
      if (!Number.isInteger(value)) {
        throw new TypeError(`${field} must be an integer (micro-USD or minutes), got ${value}`)
      }
    }
    await this.request<void>(
      withRequestOverrides(
        {
          method: 'PATCH',
          path: `/hosting/nodes/${encodeURIComponent(number)}/prices`,
          body,
        },
        request,
      ),
    )
  }
}
