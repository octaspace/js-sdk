/** Platform statistics (`GET /network`), a snapshot refreshed every few minutes. */
export interface NetworkInfo {
  /** Snapshot time, Unix **seconds** */
  at: number
  nodes: {
    online: number
    available: number
    rented: number
    countries: number
  }
  power: {
    cpu_cores: number
    /** Bytes */
    disk: number
    gpus: number
    /** GPUs on rented nodes; null where not known */
    gpus_rented?: number | null
    /** Bytes */
    memory: number
    tflops: number
  }
  render: {
    frames_24h: number
    frames_total: number
    /** `week` is an ISO date (`YYYY-MM-DD`) */
    frames_by_week: Array<{ week: string; frames: number }>
  }
  sessions: {
    running: number
    total: number
    last_24h: number
  }
  users: {
    total: number
    last_24h: number
  }
  vpn: {
    nodes: number
    countries: number
  }
}

/** Series of `GET /network/history`: one value per timestamp, the average over its step. */
export interface NetworkHistory {
  /** Start of each step, Unix **seconds**. Steps without data are left out. */
  timestamps: number[]
  nodes_online: Array<number | null>
  /** Nodes that could be rented */
  nodes_available?: Array<number | null>
  nodes_rented?: Array<number | null>
  /** Countries of the online nodes */
  countries?: Array<number | null>
  gpus: Array<number | null>
  /** GPUs on rented nodes; null where not known */
  gpus_rented: Array<number | null>
  /** FP32 TFLOPS of the online GPUs */
  tflops: Array<number | null>
  /** Nodes VPN is offered on */
  vpn_nodes?: Array<number | null>
  /** Confirmed users */
  users?: Array<number | null>
  sessions_running: Array<number | null>
  /** Sessions started in the 24 hours before */
  sessions_24h?: Array<number | null>
}

export interface NetworkHistoryOptions {
  /** Unix seconds; a day before `end` by default */
  start?: number | Date | undefined
  /** Unix seconds; now by default */
  end?: number | Date | undefined
  /** Seconds between points, ≥ 300 (default 3600); at most 2000 points */
  step?: number | undefined
}

/** One point of the network history. Values are averages over the step, so they can be fractional. */
export interface NetworkHistoryPoint {
  /** Unix **seconds** */
  ts: number
  nodesOnline: number | null
  nodesAvailable: number | null
  nodesRented: number | null
  countries: number | null
  gpus: number | null
  gpusRented: number | null
  tflops: number | null
  vpnNodes: number | null
  users: number | null
  sessionsRunning: number | null
  sessions24h: number | null
}
