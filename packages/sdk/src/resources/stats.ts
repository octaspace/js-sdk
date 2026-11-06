import type {
  GpuCurrent,
  GpuCurrentOptions,
  GpuHistory,
  GpuHistoryOptions,
  GpuHistoryPoint,
  GpuLocation,
  GpuModelHistory,
  GpuPricePercentiles,
  GpuPriceSeries,
} from '../types/stats.js'
import { nullStrings } from '../utils/null-strings.js'
import { BaseResource } from './base.js'
import { type RequestOverrides, withRequestOverrides } from './request-options.js'

function unixSeconds(value: number | Date | undefined): number | undefined {
  return value instanceof Date ? Math.floor(value.getTime() / 1000) : value
}

/** {@link GpuHistoryOptions} in the form the API takes: one model string, Unix seconds. */
export interface NormalizedGpuHistoryOptions {
  gpuName: string | undefined
  verified: GpuHistoryOptions['verified']
  start: number | undefined
  end: number | undefined
  step: number | undefined
}

/**
 * Normalizes history options the way `stats.gpuHistory()` sends them (model list joined with
 * commas, dates as Unix seconds), so equal requests compare equal — e.g. as query keys or hook
 * dependencies.
 */
export function normalizeGpuHistoryOptions(
  options: GpuHistoryOptions = {},
): NormalizedGpuHistoryOptions {
  return {
    gpuName: Array.isArray(options.gpuName) ? options.gpuName.join(',') : options.gpuName,
    verified: options.verified,
    start: unixSeconds(options.start),
    end: unixSeconds(options.end),
    step: options.step,
  }
}

/** GPU market statistics; no API key needed. */
export class StatsResource extends BaseResource {
  /** GPU models on the market now (`GET /stats/gpu/current`). */
  async gpuCurrent(
    options: GpuCurrentOptions = {},
    request?: RequestOverrides,
  ): Promise<GpuCurrent> {
    const res = await this.request<GpuCurrent>(
      withRequestOverrides(
        {
          method: 'GET',
          path: '/stats/gpu/current',
          auth: 'none',
          query: { verified: options.verified },
        },
        request,
      ),
    )
    return nullStrings(res.data)
  }

  /**
   * GPU market over time (`GET /stats/gpu/history`), by model, as parallel arrays. Defaults to
   * the last day with hourly points. Invalid ranges (`step` < 300, too many points, `start`
   * after `end`) throw an `OctaValidationError`.
   */
  async gpuHistory(
    options: GpuHistoryOptions = {},
    request?: RequestOverrides,
  ): Promise<GpuHistory> {
    const { gpuName, verified, start, end, step } = normalizeGpuHistoryOptions(options)
    const res = await this.request<GpuHistory>(
      withRequestOverrides(
        {
          method: 'GET',
          path: '/stats/gpu/history',
          auth: 'none',
          query: {
            gpu_name: gpuName,
            verified,
            start,
            end,
            step,
          },
        },
        request,
      ),
    )
    return nullStrings(res.data)
  }

  /** GPUs by city and model (`GET /stats/gpu/locations`). */
  async gpuLocations(request?: RequestOverrides): Promise<GpuLocation[]> {
    const res = await this.request<GpuLocation[]>(
      withRequestOverrides({ method: 'GET', path: '/stats/gpu/locations', auth: 'none' }, request),
    )
    return nullStrings(res.data)
  }
}

function percentilesAt(series: GpuPriceSeries | undefined, i: number): GpuPricePercentiles {
  return {
    p10: series?.p10?.[i] ?? null,
    p25: series?.p25?.[i] ?? null,
    p50: series?.p50?.[i] ?? null,
    p75: series?.p75?.[i] ?? null,
    p90: series?.p90?.[i] ?? null,
  }
}

/**
 * Turns the parallel arrays of one model's history into one object per timestamp, e.g. for a
 * chart library: `gpuHistoryPoints(history['NVIDIA GeForce RTX 4090'])`.
 */
export function gpuHistoryPoints(history: GpuModelHistory): GpuHistoryPoint[] {
  return history.timestamps.map((ts, i) => ({
    ts,
    total: history.supply_demand?.total?.[i] ?? null,
    available: history.supply_demand?.available?.[i] ?? null,
    rented: history.supply_demand?.rented?.[i] ?? null,
    availablePrice: percentilesAt(history.available_price, i),
    rentedPrice: percentilesAt(history.rented_price, i),
  }))
}
