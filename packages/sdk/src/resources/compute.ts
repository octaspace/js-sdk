import type { BatchResult, StartResult } from '../types/common.js'
import type {
  ComputeBatchItem,
  ComputeMachine,
  ComputeRestartParams,
  ComputeStartParams,
} from '../types/compute.js'
import { BaseResource } from './base.js'
import { normalizeMachines, pickDefined, withBatchIds } from './machines.js'
import { type RequestOverrides, withRequestOverrides } from './request-options.js'

const RESTART_FIELDS = [
  'disk_size',
  'envs',
  'ports',
  'http_ports',
  'entrypoint',
  'args',
  'ssh',
  'fm',
  'startup_script',
] as const satisfies readonly (keyof ComputeRestartParams)[]

const START_FIELDS = [
  'node_number',
  'image',
  'app',
  ...RESTART_FIELDS,
] as const satisfies readonly (keyof ComputeStartParams)[]

/** Compute machines: listing, start (single and batch) and restart. */
export class ComputeResource extends BaseResource {
  /**
   * Machines available for rent (`GET /services/compute`). Works without an API key, but the
   * anonymous listing is cached for up to an hour; with a key it is at most 10 seconds old.
   */
  async list(request?: RequestOverrides): Promise<ComputeMachine[]> {
    const res = await this.request<ComputeMachine[]>(
      withRequestOverrides({ method: 'GET', path: '/services/compute', auth: 'optional' }, request),
    )
    return normalizeMachines(res.data)
  }

  /**
   * Starts one session (`POST /services/compute` with an object → 201). Validation and business
   * errors (`Insufficient balance`, `Node not available`, …) throw an `OctaValidationError`.
   * Never retried automatically: a start costs money.
   */
  async start(params: ComputeStartParams, request?: RequestOverrides): Promise<StartResult> {
    const res = await this.request<StartResult>(
      withRequestOverrides(
        {
          method: 'POST',
          path: '/services/compute',
          body: pickDefined(params, START_FIELDS),
        },
        request,
      ),
    )
    return res.data
  }

  /**
   * Starts several sessions at once (`POST /services/compute` with an array → 200). Each item is
   * validated on its own and reported in the result in request order; a failed item does not fail
   * the batch. Items without an `id` get their position in the array.
   */
  async startBatch(
    items: readonly ComputeBatchItem[],
    request?: RequestOverrides,
  ): Promise<BatchResult[]> {
    const body = withBatchIds(items).map((item) => ({
      id: item.id,
      ...pickDefined(item, START_FIELDS),
    }))
    const res = await this.request<BatchResult[]>(
      withRequestOverrides({ method: 'POST', path: '/services/compute', body }, request),
    )
    return res.data
  }

  /**
   * Recreates the session's container on the same node, keeping the rent, `uuid` and prices
   * (`POST /services/compute/{uuid}/restart` → 202). Follow the progress with
   * `sessions.get(uuid)`; if the new parameters cannot be applied, the session stops.
   *
   * - Without `params`: restarts with the original parameters.
   * - With `params`: **replaces all parameters**; omitted fields get fixed defaults, including
   *   `disk_size` = 1 GB. See {@link ComputeRestartParams}.
   *
   * Throws `OctaConflictError` (409) while the session is still starting or restarting, and
   * `OctaRateLimitError` (429) when restarted more often than once per 5 minutes / 6 per hour
   * (`retryAfter` says how long to wait). Never retried automatically.
   */
  async restart(
    uuid: string,
    params?: ComputeRestartParams,
    request?: RequestOverrides,
  ): Promise<StartResult> {
    const body = params ? pickDefined(params, RESTART_FIELDS) : undefined
    const res = await this.request<StartResult | undefined>(
      withRequestOverrides(
        {
          method: 'POST',
          path: `/services/compute/${encodeURIComponent(uuid)}/restart`,
          ...(body !== undefined && Object.keys(body).length > 0 && { body }),
        },
        request,
      ),
    )
    return res.data ?? { uuid }
  }
}
