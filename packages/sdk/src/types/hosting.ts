import type { MicroUsd, NodeNumber } from './common.js'

export type HostingNodeStatus = 'idle' | 'rented' | 'verification' | 'benchmark' | 'unknown'

/** Memory or disk usage of a hosted node, bytes. */
export interface HostingNodeUsage {
  size: number
  free: number
  used: number
  used_percent: number
}

/** Prices of a hosted node. */
export interface HostingNodePrices {
  /** Per hour of rent */
  base: MicroUsd
  /** Per GB of disk per hour */
  storage: MicroUsd
  /** Per GB of traffic */
  traffic: MicroUsd
  /** Minimum rent, minutes; 0 = none */
  min_rent_minutes: number
}

/** A node of the account (`GET /hosting/nodes`). Only online nodes are listed. */
export interface HostingNode {
  /** Node number, the one renters see and `setPrices` takes */
  number: NodeNumber
  status: HostingNodeStatus
  /** A verification or benchmark in progress */
  activity?: {
    kind: 'verification' | 'benchmark'
    step: string
    /** Unix **seconds** */
    started_at: number | null
  } | null
  /** Under maintenance: not offered for rent */
  maintenance?: boolean
  /** Passed verification; null while unknown */
  verified?: boolean | null
  /** For which services the node is offered, and why not (e.g. `ports_closed`) */
  services?: Record<string, { offered: boolean; reason?: string | null }> | null
  prices: HostingNodePrices
  system: {
    cpu_cores?: number | null
    cpu_model_name?: string | null
    cpu_load_percent?: number | null
    os_version?: string | null
    memory?: HostingNodeUsage | null
    disk?: HostingNodeUsage | null
    /**
     * GPUs of the node: `model` and `mem_total_mb`, and clocks, temperature, fan speed, power
     * draw and utilization when the node reports them.
     */
    gpus?: Array<{ model?: string; mem_total_mb?: number | null; [key: string]: unknown }>
  }
  location: {
    city?: string
    country?: string
    latitude?: number
    longitude?: number
  }
  ip?: string | null
  /** Version of the node software */
  osn?: string | null
  /** Online since, ISO 8601 */
  online_at?: string | null
  /** Seconds since the machine booted */
  uptime?: number | null
  /** Online share over 30 days; 97 and above are reported as 100 */
  uptime_percent?: number | null
}

/**
 * Price update for `PATCH /hosting/nodes/{number}/prices`: at least one field, integers only.
 * Fields that are not set keep their value.
 */
export interface NodePrices {
  /** Per hour, 100 … 1 000 000 000 micro-USD */
  base?: MicroUsd | undefined
  /** Per GB of disk per hour, 0 … 1 000 000 000 micro-USD */
  storage?: MicroUsd | undefined
  /** Per GB of traffic, 100 … 1 000 000 000 micro-USD */
  traffic?: MicroUsd | undefined
  /** 0 … 60 minutes; 0 = no minimum rent */
  min_rent_minutes?: number | undefined
}
