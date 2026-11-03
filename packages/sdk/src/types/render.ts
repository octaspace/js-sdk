import type { BatchId, MachineGpu, MicroUsd, NodeNumber, Reliability } from './common.js'

/** Node available for render (`GET /services/render`): an NVIDIA GPU with a Blender score. */
export interface RenderMachine {
  node_number: NodeNumber
  /** Price per hour; render is billed by time only (no storage or traffic price) */
  base_price: MicroUsd
  /** Minimum rent, minutes; 0 = none */
  min_rent_minutes: number
  /** Blender benchmark: the OptiX score, the CUDA one when there is none */
  blender_score: number
  cpu_cores: number
  cpu_model_name: string
  /** Free memory, bytes */
  memory: number
  /** Free disk space, bytes */
  disk: number
  /** Download speed, Mbit/s; 0 if not measured */
  net_down_mbps: number
  /** Upload speed, Mbit/s; 0 if not measured */
  net_up_mbps: number
  gpu_vendor: string | null
  gpus: MachineGpu[]
  cuda_version: string | null
  city: string
  country: string | null
  reliability: Reliability
}

/**
 * Parameters of `POST /services/render` (`RenderRequest`): the node runs a render node for the
 * account, billed by the hour until stopped. Legacy fields (`node_id`, `disk_size`, `subkind`,
 * `envs`) are refused by the API.
 */
export interface RenderStartParams {
  node_number: NodeNumber
}

/** One item of a batch render start. */
export interface RenderBatchItem extends RenderStartParams {
  /** Echoed in the result; defaults to the item's position in the array */
  id?: BatchId | undefined
}
