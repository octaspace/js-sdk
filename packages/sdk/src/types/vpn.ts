import type { MicroUsd, NodeNumber } from './common.js'

/** VPN protocol a node can pass the end-to-end check for. */
export type VpnProtocol = 'wg' | 'reality' | 'awg' | 'http_proxy'

/** Protocols of a `v2ray` session. */
export type V2RayProtocol = 'vless' | 'vmess' | 'trojan'

/** Node offered for VPN (`GET /services/vpn`). */
export interface VpnMachine {
  node_number: NodeNumber
  /** Price per GB of traffic; VPN is billed by traffic only */
  traffic_price: MicroUsd
  /**
   * Protocols that passed the end-to-end check on this node, at least one. Start a session with
   * one of them: a checked protocol the node did not pass is refused.
   */
  protocols: VpnProtocol[]
  city?: string
  country?: string | null
  /** ISO 3166-1 alpha-2 */
  country_iso?: string | null
  latitude?: number | null
  longitude?: number | null
  /** The node's address is believed to be assigned to a residence */
  residential?: boolean
  /** Download speed, Mbit/s; 0 if not measured */
  net_down_mbps?: number
  /** Upload speed, Mbit/s; 0 if not measured */
  net_up_mbps?: number
}

/**
 * Parameters of `vpn.start()`.
 *
 * - `wg` (WireGuard), `awg` (AmneziaWG), `reality` (VLESS Reality): what nodes are checked for.
 * - `http_proxy`: an HTTP proxy that lets in only the IP address the start request came from.
 * - `v2ray`: a V2Ray link; `protocol` defaults to `trojan`. Nodes are not checked for it, so it
 *   is never in `protocols` and is accepted on any VPN node, without a check that it works there.
 */
export type VpnStartParams =
  | {
      node_number: NodeNumber
      subkind: VpnProtocol
    }
  | {
      node_number: NodeNumber
      subkind: 'v2ray'
      protocol?: V2RayProtocol | undefined
    }
