import type { BatchId, MachineGpu, MicroUsd, NodeNumber, Reliability, UserEnvs } from './common.js'

/** Machine available for rent (`GET /services/compute`). */
export interface ComputeMachine {
  node_number: NodeNumber
  /** Price per hour of rent */
  base_price: MicroUsd
  /** Price per GB of disk per hour */
  storage_price: MicroUsd
  /** Price per GB of traffic */
  traffic_price: MicroUsd
  /**
   * Minimum rent, minutes; 0 = none. A session stopped sooner is charged base and storage for
   * this long.
   */
  min_rent_minutes: number
  arch: 'x86_64' | 'aarch64'
  cpu_cores: number
  cpu_model_name: string
  /** Free memory, bytes */
  memory: number
  /** Memory speed, MT/s */
  memory_speed: number
  memory_type: string
  /** Free disk space, bytes */
  disk: number
  disk_type: 'nvme' | 'ssd' | 'hdd' | null
  /** Disk speed, MB/s */
  disk_speed_mbs: number
  /** Download speed, Mbit/s; 0 if not measured */
  net_down_mbps: number
  /** Upload speed, Mbit/s; 0 if not measured */
  net_up_mbps: number
  /** Free service ports */
  free_ports: number
  gpu_vendor: string | null
  gpus: MachineGpu[]
  cuda_version: string | null
  ai_score: number
  blender_score: number
  city: string
  country: string | null
  reliability: Reliability
}

/** Parameters of `POST /services/compute` (`ComputeRequest`). Only fields that are set are sent. */
export interface ComputeStartParams {
  /** Machine number from the listing */
  node_number: NodeNumber
  /** Docker image, e.g. `ubuntu:24.04` */
  image: string
  /** Application UUID */
  app?: string | undefined
  /** Disk size, GB (≥ 1, default 1) */
  disk_size?: number | undefined
  envs?: UserEnvs | undefined
  /** TCP/UDP ports to expose; 0 and 22 (SSH is always exposed) are ignored */
  ports?: number[] | undefined
  /** HTTP ports to expose (up to 10); 0 is ignored, 7681 and 7682 are reserved */
  http_ports?: number[] | undefined
  /**
   * Replaces the image's ENTRYPOINT (and drops its CMD), one line up to 4 KiB. Split like a
   * shell command line, but nothing is expanded: use `sh -c '…'` for `$VAR`, `*`, `&&`.
   */
  entrypoint?: string | undefined
  /** Replaces the image's CMD, one line up to 4 KiB, split like `entrypoint` */
  args?: string | undefined
  /**
   * Web terminal and SSH (through the proxy, and directly when the account has an SSH key).
   * Tri-state: `undefined` = the app's setting (off without an app), `true`/`false` = explicit.
   */
  ssh?: boolean | undefined
  /**
   * Web file manager without login: anyone with its URL has the files. Not available for VM apps.
   * Tri-state like `ssh`.
   */
  fm?: boolean | undefined
  /**
   * Script run as root in the background once the container is up (up to 64 KiB); output goes to
   * `/var/log/onstart.log`. It runs alongside the container's command, not before it.
   */
  startup_script?: string | undefined
}

/** One item of a batch start: a {@link ComputeStartParams} with an optional client id. */
export interface ComputeBatchItem extends ComputeStartParams {
  /** Echoed in the result; defaults to the item's position in the array */
  id?: BatchId | undefined
}

/**
 * New parameters for `POST /services/compute/{uuid}/restart` (`ComputeRestartRequest`).
 *
 * **A non-empty body replaces all parameters of the session**, it does not merge with them.
 * Every field you leave out falls back to a fixed default, not to the session's current value:
 *
 * | Field | Default when omitted |
 * |---|---|
 * | `disk_size` | **1 GB**, not the session's size |
 * | `entrypoint`, `args` | the image's own |
 * | `startup_script` | none |
 * | `envs` | none |
 * | `ports`, `http_ports` | none |
 * | `ssh`, `fm` | the app's setting, off without an app |
 *
 * Empty values (`''`, `[]`, `{}`) count as omitted. The session's info does not report
 * `entrypoint`, `args`, `startup_script` or `disk_size`, so pass the complete set you want. To
 * restart with the original parameters, call `restart(uuid)` without params.
 *
 * The node, image and app cannot be changed.
 */
export interface ComputeRestartParams {
  /** Disk size, GB (≥ 1). Omitted: **1 GB** */
  disk_size?: number | undefined
  envs?: UserEnvs | undefined
  ports?: number[] | undefined
  http_ports?: number[] | undefined
  entrypoint?: string | undefined
  args?: string | undefined
  /** Tri-state: `undefined` = the app's setting, `false` = explicitly off */
  ssh?: boolean | undefined
  /** Tri-state: `undefined` = the app's setting, `false` = explicitly off */
  fm?: boolean | undefined
  startup_script?: string | undefined
}
