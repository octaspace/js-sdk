export type ServiceKind = 'mr' | 'render' | 'vpn'

export interface SshAccess {
  host: string
  port: number
}

/** Maps host port → container port */
export type PortsMatrix = Record<string, number>

export interface SystemLogEntry {
  msg: string
  /** Timestamp in Unix **milliseconds** */
  ts: number
}

export interface SessionPrices {
  base_usd: number
  currency_usd: boolean
  market_price: number
}

export interface SessionNodeGpu {
  model: string
  /** GPU memory in MB */
  mem_total_mb: number
}

export interface SessionNodeHw {
  cpu: string
  cpu_cores: number
  gpu: SessionNodeGpu[]
  /** Total RAM in bytes */
  total_memory: number
  /** Disk size in bytes */
  disk: number
}

/**
 * Session list entry — returned by GET /sessions and GET /services/{uuid}/info
 * (merged model: info endpoint returns extra fields like config, tx, rx, charge_amount)
 */
export interface ServiceInfo {
  uuid: string
  service: ServiceKind
  app_name?: string
  app_logo?: string
  node_id: number
  /** Human-readable lifecycle state (e.g. 'service configured') */
  progress?: string
  is_ready: boolean
  /** Session duration in seconds */
  duration: number
  /** Session start time — Unix timestamp in **milliseconds** */
  started_at: number
  public_ip?: string
  /** Private/VPN IP if applicable */
  ip?: string
  country?: string
  country_iso?: string
  city?: string
  ports_matrix?: PortsMatrix
  urls?: Record<string, string>
  ssh_direct?: SshAccess
  ssh_proxy?: SshAccess
  ssh_web?: string
  /**
   * VPN configuration string (WireGuard / OpenVPN / etc.) — from /info endpoint.
   * Note: the Swagger spec names this field `vpn_config`, but the real API returns it as `config`.
   */
  config?: string
  /** Transmitted bytes — from /info endpoint */
  tx?: number
  /** Received bytes — from /info endpoint */
  rx?: number
  /**
   * Amount charged in Wei. The API may return this as a number or as a
   * string-encoded integer for large values to avoid precision loss.
   */
  charge_amount?: number | string
  node_hw?: SessionNodeHw
  prices?: SessionPrices
}

export interface SessionLogs {
  container: string
  system: SystemLogEntry[]
}

export type Session = ServiceInfo
