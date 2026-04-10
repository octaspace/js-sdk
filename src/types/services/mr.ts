export interface MrGpu {
  model: string
  /** GPU memory in MB */
  mem_total_mb: number
}

/** GPU breakdown by vendor (raw field from API) */
export interface MrGpuByVendor {
  nvidia: MrGpu[]
  amd: MrGpu[]
  intel: MrGpu[]
}

export interface MrReliability {
  uptime: number
  stability: number
  s_avg_d: number
  s_max_d: number
  s_normal: number
  s_failed: number
  rating: {
    count: number
    score: number
  }
}

export interface MrMachine {
  node_id: number
  country: string
  country_iso: string
  city: string
  cpu_model_name: string
  cpu_cores: number
  cpu_speed: number
  cpu_vendor_id: string
  /** Total RAM in bytes */
  total_memory: number
  memory_type: string
  memory_speed: number
  /** Free disk space in bytes */
  free_disk: number
  arch: string
  os_version: string
  is_hive_os: boolean
  is_wsl: boolean
  virt: string
  cuda_version: string
  /** Array of GPU objects */
  gpus: MrGpu[]
  /**
   * GPU breakdown by vendor.
   * @deprecated Use `gpus` instead.
   */
  gpu: MrGpuByVendor
  is_has_gpu: boolean
  ai_score: number
  blender_score: number
  /** GPU CUDA performance on Blender benchmark (may be absent for CPU-only nodes) */
  blender_cuda_score?: number
  /** Download speed in Mbps */
  net_down_mbits: number
  /** Upload speed in Mbps */
  net_up_mbits: number
  /** Total hourly price in USD (float) */
  total_price_usd: number
  /** Total hourly price in Wei */
  total_price_wei: number
  /** Total hourly price in Ether */
  total_price_ether: number
  /** Base price in Wei */
  base: number
  /** Base price in Ether */
  base_ether: number
  /** Storage price in Wei */
  storage: number
  /** Storage price in Ether */
  storage_ether: number
  /** Traffic price in Wei */
  traffic: number
  /** Traffic price in Ether */
  traffic_ether: number
  reliability: MrReliability
  features: string[]
  available_ports: number
}

export interface StartMrOptions {
  node_id: number
  /** Disk allocation in GB */
  disk_size: number
  /**
   * Docker image name — required by the API.
   * When using `app`, pass the app's `image` field (e.g. `"ubuntu:24.04"`).
   */
  image: string
  /** Application UUID */
  app?: string
  envs?: Record<string, string>
  /** TCP ports to expose */
  ports?: number[]
  /** HTTP ports to expose */
  http_ports?: number[]
  start_command?: string
  entrypoint?: string
}

export interface StartMrResult {
  uuid: string
}
