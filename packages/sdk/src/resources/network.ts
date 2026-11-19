import type {
  NetworkHistory,
  NetworkHistoryOptions,
  NetworkHistoryPoint,
  NetworkInfo,
} from '../types/network.js'
import { nullStrings } from '../utils/null-strings.js'
import { unixSeconds } from '../utils/time.js'
import { BaseResource } from './base.js'
import { type RequestOverrides, withRequestOverrides } from './request-options.js'

/** {@link NetworkHistoryOptions} in the form the API takes: Unix seconds. */
export interface NormalizedNetworkHistoryOptions {
  start: number | undefined
  end: number | undefined
  step: number | undefined
}

/**
 * Normalizes history options the way `network.history()` sends them (dates as Unix seconds), so
 * equal requests compare equal — e.g. as query keys or hook dependencies.
 */
export function normalizeNetworkHistoryOptions(
  options: NetworkHistoryOptions = {},
): NormalizedNetworkHistoryOptions {
  return { start: unixSeconds(options.start), end: unixSeconds(options.end), step: options.step }
}

/** Platform statistics; no API key needed. */
export class NetworkResource extends BaseResource {
  /** Platform statistics now (`GET /network`). */
  async info(request?: RequestOverrides): Promise<NetworkInfo> {
    const res = await this.request<NetworkInfo>(
      withRequestOverrides({ method: 'GET', path: '/network', auth: 'none' }, request),
    )
    return nullStrings(res.data)
  }

  /**
   * Platform statistics over time (`GET /network/history`) as parallel arrays, a point per
   * `step`. Defaults to the last day with hourly points. Invalid ranges (`step` < 300, too many
   * points, `start` after `end`) throw an `OctaValidationError`.
   */
  async history(
    options: NetworkHistoryOptions = {},
    request?: RequestOverrides,
  ): Promise<NetworkHistory> {
    const { start, end, step } = normalizeNetworkHistoryOptions(options)
    const res = await this.request<NetworkHistory>(
      withRequestOverrides(
        { method: 'GET', path: '/network/history', auth: 'none', query: { start, end, step } },
        request,
      ),
    )
    return nullStrings(res.data)
  }
}

/** Turns the parallel arrays of the network history into one object per timestamp. */
export function networkHistoryPoints(history: NetworkHistory): NetworkHistoryPoint[] {
  return history.timestamps.map((ts, i) => ({
    ts,
    nodesOnline: history.nodes_online?.[i] ?? null,
    nodesAvailable: history.nodes_available?.[i] ?? null,
    nodesRented: history.nodes_rented?.[i] ?? null,
    countries: history.countries?.[i] ?? null,
    gpus: history.gpus?.[i] ?? null,
    gpusRented: history.gpus_rented?.[i] ?? null,
    tflops: history.tflops?.[i] ?? null,
    vpnNodes: history.vpn_nodes?.[i] ?? null,
    users: history.users?.[i] ?? null,
    sessionsRunning: history.sessions_running?.[i] ?? null,
    sessions24h: history.sessions_24h?.[i] ?? null,
  }))
}
