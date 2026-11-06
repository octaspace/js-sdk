/**
 * Node number: 8 Crockford base32 symbols and a check symbol, written as `XXXX-XXXX-X` (e.g.
 * `7KQ4-M2XD-4`). Case, dashes and spaces are ignored, `O` is read as `0`, `I` and `L` as `1`.
 */
export type NodeNumber = string

/** Amount of money in micro-USD: `1` = $0.000001. Use `formatUsd()` / `microUsdToUsd()` to display. */
export type MicroUsd = number

/** GPU as reported in machine listings. */
export interface MachineGpu {
  model: string
  /** Total memory, MB. This and the other integer fields are `null` when unknown. */
  mem_total_mb: number | null
  pcie_link_gen: number | null
  pcie_link_width: number | null
  /** Core clock ceiling, MHz (the one the owner locked, otherwise the card's maximum) */
  core_clock?: number | null
  /** Memory clock ceiling, MHz */
  mem_clock?: number | null
  /** Power limit, watts */
  power_limit?: number | null
  /** The owner changed the power limit or locked clocks */
  tuned?: boolean
}

/**
 * Node reliability: `uptime` is the percent of time online over the last 30 days; session
 * stability counters (`stability`, `s_normal`, `s_failed`, …) are present when known.
 */
export interface Reliability {
  uptime?: number
  [key: string]: unknown
}

/** User environment variables: up to 64, values up to 4 KiB. */
export type UserEnvs = Record<string, string>

/** Client-chosen id of a batch item, echoed back in its result. Any JSON scalar. */
export type BatchId = string | number

/**
 * Result of one batch item, in request order. Items are validated one by one: a failed item does
 * not fail the batch (even a temporarily unavailable service is reported as `status: 1`).
 */
export type BatchResult =
  | { id: BatchId; status: 0; uuid: string }
  | { id: BatchId; status: 1; reason: string }

/** A service start or restart accepted by the API. */
export interface StartResult {
  uuid: string
}
