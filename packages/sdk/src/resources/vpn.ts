import type { StartResult } from '../types/common.js'
import type { VpnMachine, VpnStartParams } from '../types/vpn.js'
import { nullStrings } from '../utils/null-strings.js'
import { BaseResource } from './base.js'
import { type RequestOverrides, withRequestOverrides } from './request-options.js'

/** VPN nodes: listing and start. */
export class VpnResource extends BaseResource {
  /**
   * Nodes offered for VPN (`GET /services/vpn`). Works without an API key, but is then refreshed
   * about once an hour; with a key it is at most 10 seconds old.
   */
  async list(request?: RequestOverrides): Promise<VpnMachine[]> {
    const res = await this.request<VpnMachine[]>(
      withRequestOverrides({ method: 'GET', path: '/services/vpn', auth: 'optional' }, request),
    )
    return nullStrings(res.data)
  }

  /**
   * Starts a VPN session (`POST /services/vpn`), billed by traffic until stopped with
   * `sessions.stop()`. Once `sessions.waitReady()` returns it, the session's `config` is what the
   * client connects with.
   *
   * Pick a `subkind` from the node's `protocols`: a session of another protocol still starts,
   * but may not work on that node. An account can have one VPN session per node. Validation and business
   * errors (`Insufficient balance`, `Node not found`, `You already have a VPN session on this
   * node`, …) throw an `OctaValidationError`. Never retried automatically.
   */
  async start(params: VpnStartParams, request?: RequestOverrides): Promise<StartResult> {
    const body: Record<string, unknown> = {
      node_number: params.node_number,
      subkind: params.subkind,
    }
    if (params.subkind === 'v2ray' && params.protocol !== undefined) {
      body.protocol = params.protocol
    }
    const res = await this.request<StartResult>(
      withRequestOverrides({ method: 'POST', path: '/services/vpn', body }, request),
    )
    return res.data
  }
}
