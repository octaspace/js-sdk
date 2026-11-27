import type { MicroUsd, NodeNumber } from './common.js'

/** VPN protocol a node can pass the end-to-end check for. */
export type VpnProtocol = 'wg' | 'reality' | 'awg' | 'http_proxy'

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
 * Parameters of `vpn.start()`: `wg` (WireGuard), `awg` (AmneziaWG), `reality` (VLESS Reality) or
 * `http_proxy`, an HTTP proxy with a login that lets in only the IP address the start request came
 * from. Pick one of the node's `protocols`.
 */
export interface VpnStartParams {
  node_number: NodeNumber
  subkind: VpnProtocol
}

/**
 * What an `http_proxy` session connects with: the proxy's address and its login (HTTP Basic,
 * letters and digits, valid for this session).
 */
export interface HttpProxyConfig {
  ip: string
  port: number
  username: string | null
  password: string | null
}
