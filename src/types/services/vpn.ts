export type VpnSubkind = 'wg' | 'openvpn' | 'ss' | 'v2ray'
export type VpnProtocol = 'trojan' | 'vmess' | 'vless'

export interface VpnNode {
  node_id: number
  country: string
  country_iso: string
  city: string
  latitude: number
  longitude: number
  /** Download speed in Mbps */
  net_down_mbits: number
  /** Upload speed in Mbps */
  net_up_mbits: number
  residential: boolean
  /** Price per GB in USD (float) */
  traffic_price_usd: number
  /** Price per GB in Ether */
  traffic_price_ether: number
}

export interface StartVpnOptions {
  node_id: number
  /** VPN protocol type (default: 'wg') */
  subkind?: VpnSubkind
  /** V2Ray sub-protocol (default: 'trojan', only for subkind='v2ray') */
  protocol?: VpnProtocol
}

export interface StartVpnResult {
  uuid: string
}
