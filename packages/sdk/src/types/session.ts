import type { MicroUsd, NodeNumber, UserEnvs } from './common.js'

/** `starting` while the session is being configured, then `ready`. */
export type SessionStatus = 'starting' | 'ready'

/** Fields every session has, whatever its service. */
export interface SessionBase {
  /** Service kind: `compute`, `render` or `vpn` */
  service: string
  uuid: string
  status: SessionStatus
  /** Current configuration step, e.g. `Prepare node`, `Service configured` */
  progress?: string | null
  /** Image pull progress, percent (an estimate), while the image is being pulled */
  pull_percent?: number | null
  /** Seconds since start */
  duration: number
  /** Start time, Unix **milliseconds**; null while starting */
  started_at?: number | null
  /** Null while starting */
  node_number?: NodeNumber | null
  /** Price per hour at start; null while starting */
  base_price?: MicroUsd | null
  /** Charged so far */
  charge_amount?: MicroUsd
  app_name?: string | null
  app_logo?: string | null
}

/** Where to connect with SSH. */
export interface SshEndpoint {
  host: string
  port: number
  /**
   * User to log in as: the image's `USER`, `root` when it sets none. The image author controls
   * it, so validate `user` and `host` before passing them to `ssh`, and pass them as separate
   * arguments after `--` (e.g. `ssh -p PORT -l USER -- HOST`).
   */
  user: string
}

export interface SessionSsh {
  /** Directly on the node; only when the account has an SSH key */
  direct: SshEndpoint | null
  /** Through the proxy */
  proxy: SshEndpoint | null
  /**
   * Web terminal URL. **It contains credentials** (`https://user:pass@…`): do not log it or show
   * it in shared output.
   */
  web: string | null
}

/** Node hardware of a compute session, as of its start; null while starting. */
export interface ComputeSessionNodeHw {
  cpu?: string | null
  cpu_cores?: number | null
  /** Bytes */
  total_memory?: number | null
  /** MT/s */
  memory_speed?: number | null
  memory_type?: string | null
  /** Rented disk, **GB** (unlike `disk` in listings, which is free bytes) */
  disk?: number | null
  disk_type?: 'nvme' | 'ssd' | 'hdd' | null
  disk_speed_mbs?: number | null
  gpu_vendor?: string | null
  gpus?: Array<{ model?: string | null; mem_total_mb?: number | null }>
  /** Download speed, Mbit/s */
  net_down_mbps?: number | null
  /** Upload speed, Mbit/s */
  net_up_mbps?: number | null
}

/** A running compute session (`service: "compute"`). */
export interface ComputeSession extends SessionBase {
  service: 'compute'
  public_ip?: string | null
  city?: string | null
  country?: string | null
  /** ISO 3166-1 alpha-2 */
  country_iso?: string | null
  /** Container port → public port on the node */
  ports?: Record<string, number>
  /** HTTP port → public URL */
  urls?: Record<string, string>
  ssh?: SessionSsh
  /**
   * Web file manager URL; null when not asked for, not started yet, or failed. No login: whoever
   * has the URL has the files.
   */
  fm?: string | null
  envs?: UserEnvs
  /** Bytes received */
  rx?: number
  /** Bytes sent */
  tx?: number
  /** Price per GB of disk per hour at start */
  storage_price?: MicroUsd | null
  /** Price per GB of traffic at start */
  traffic_price?: MicroUsd | null
  /** Minimum rent at start, minutes; stopped sooner, base and storage are charged for this long */
  min_rent_minutes?: number | null
  node_hw?: ComputeSessionNodeHw | null
}

/** A running render session (`service: "render"`). */
export interface RenderSession extends SessionBase {
  service: 'render'
  node_hw?: {
    cpu_cores?: number | null
    /** Bytes */
    total_memory?: number | null
    gpus?: Array<{ model?: string | null; mem_total_mb?: number | null }>
  } | null
}

/**
 * A running VPN session (`service: "vpn"`). Billed by traffic; it does not make the node
 * `rented`. It has no logs: `sessions.logs()` throws `OctaNotFoundError` for it.
 */
export interface VpnSession extends SessionBase {
  service: 'vpn'
  /** `wg`, `awg`, `reality`, `http_proxy` or `v2ray` */
  subkind?: string | null
  /**
   * What the client connects with: a config file (WireGuard, AmneziaWG) or a link; null until
   * `ready`. **It is a credential** (a WireGuard config holds the private key): do not log it or
   * show it in shared output.
   */
  config?: string | null
  /** Exit IP address of the VPN */
  public_ip?: string | null
  city?: string | null
  country?: string | null
  /** ISO 3166-1 alpha-2 */
  country_iso?: string | null
  /** Bytes received */
  rx?: number
  /** Bytes sent */
  tx?: number
}

/**
 * A running session. Narrow it with `isComputeSession()` / `isRenderSession()` /
 * `isVpnSession()`; a session of another service is returned with every field the API sent.
 */
export type Session =
  | ComputeSession
  | RenderSession
  | VpnSession
  | (SessionBase & Record<string, unknown>)

/** A platform event of a session. */
export interface SystemLogEvent {
  /** May span several lines (e.g. image pull output) */
  msg: string
  /** Unix **milliseconds**; null if unknown */
  ts?: number | null
}

/** Logs of a running compute session (`GET /services/{uuid}/logs`); render and VPN have none. */
export interface SessionLogs {
  /** Platform events, oldest first */
  system: SystemLogEvent[]
  /**
   * Latest container output as `docker logs` gives it (up to 1 MiB from the end, may contain
   * `\r\n` from a TTY); null when the node cannot be reached or has no output yet.
   */
  container: string | null
  /** The output was cut to its last 1 MiB, starting at a whole line */
  container_truncated: boolean
}

export interface SessionLogsOptions {
  /** Number of latest container lines, 1..1000 (default 200) */
  tail?: number | undefined
}

export interface WaitOptions {
  /** Poll interval, ms (default 3000; keep it ≥ 2000 to stay within the rate limit) */
  intervalMs?: number | undefined
  /** Give up after this many ms with an `OctaTimeoutError` (default: wait until aborted) */
  timeoutMs?: number | undefined
  /** Abort the wait */
  signal?: AbortSignal | undefined
}

export interface WaitReadyOptions extends WaitOptions {
  /** Called with every polled state, e.g. to show `progress` and `pull_percent` */
  onProgress?: ((session: Session) => void) | undefined
}
