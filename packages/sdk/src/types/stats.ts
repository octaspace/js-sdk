import type { MicroUsd } from './common.js'

/** Which nodes statistics cover: all, verified only, or unverified only. */
export type GpuVerifiedFilter = 'all' | 'yes' | 'no'

/** Price percentiles, micro-USD per GPU-hour; null when there is no data. */
export interface GpuPricePercentiles {
  p10: MicroUsd | null
  p25: MicroUsd | null
  p50: MicroUsd | null
  p75: MicroUsd | null
  p90: MicroUsd | null
}

/** Market state of one GPU model. Counts are GPUs, not nodes. */
export interface GpuModelStats {
  model: string
  total: number
  available: number
  rented: number
  /** Rented share now */
  usage: number
  /** Rented share over 30 days */
  usage_30d?: number | null
  ai_score: number
  tflops?: number | null
  tflops_per_dollar?: number | null
  /** Prices only from nodes with identical GPUs */
  available_price: GpuPricePercentiles
  rented_price: GpuPricePercentiles
}

/** `GET /stats/gpu/current`: models with the most GPUs first. */
export interface GpuCurrent {
  /** Snapshot time, Unix **seconds** */
  at: number | null
  gpus: GpuModelStats[]
}

export interface GpuCurrentOptions {
  verified?: GpuVerifiedFilter | undefined
}

/** Price percentile series, one value per timestamp. */
export interface GpuPriceSeries {
  p10: Array<MicroUsd | null>
  p25: Array<MicroUsd | null>
  p50: Array<MicroUsd | null>
  p75: Array<MicroUsd | null>
  p90: Array<MicroUsd | null>
}

/** History of one GPU model as parallel arrays: index `i` of each array belongs to `timestamps[i]`. */
export interface GpuModelHistory {
  /** Unix **seconds** */
  timestamps: number[]
  supply_demand: {
    total: number[]
    available: number[]
    rented: number[]
  }
  available_price: GpuPriceSeries
  rented_price: GpuPriceSeries
  tflops?: number | null
}

/** `GET /stats/gpu/history`: by GPU model. Use `gpuHistoryPoints()` to get rows instead of columns. */
export type GpuHistory = Record<string, GpuModelHistory>

export interface GpuHistoryOptions {
  /** GPU models, or `'all'` (default) */
  gpuName?: string | string[] | undefined
  verified?: GpuVerifiedFilter | undefined
  /** Unix seconds; defaults to the last day together with `end` */
  start?: number | Date | undefined
  /** Unix seconds */
  end?: number | Date | undefined
  /** Seconds between points, ≥ 300 (default 3600); at most 2000 points */
  step?: number | undefined
}

/** One point of a GPU model's history. */
export interface GpuHistoryPoint {
  /** Unix **seconds** */
  ts: number
  total: number | null
  available: number | null
  rented: number | null
  availablePrice: GpuPricePercentiles
  rentedPrice: GpuPricePercentiles
}

/** `GET /stats/gpu/locations`: GPUs by city and model (GeoIP), not per node. */
export interface GpuLocation {
  city: string
  country: string
  latitude?: number | null
  longitude?: number | null
  model: string
  gpus: number
  rented: number
  verified: number
}
