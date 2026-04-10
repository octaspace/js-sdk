export interface NodeGpu {
  model: string
  /** GPU memory in MB */
  mem_total_mb: number
  /** Free GPU memory in MB */
  mem_free_mb: number
  /** GPU index */
  idx?: number
  bus_id?: string
  pcie_link_gen?: number
  pcie_link_width?: number
  gpu_utilization?: number
  gpu_temperature?: number
  fan_speed?: number
  /** Current power limit in Watts */
  power_limit_watt?: number
  /** Default power limit in Watts */
  power_limit_default_watt?: number
  /** GPU performance state */
  pstate?: string
}

export interface NodeDisk {
  /** Free disk space in bytes */
  free: number
  /** Total disk size in bytes */
  size: number
  used_percent: number
}

export interface NodeMemory {
  /** Free memory in bytes */
  free: number
  /** Total memory in bytes */
  size: number
}

export interface NodeSystem {
  arch: string
  cpu_cores: number
  cpu_load_percent: number
  cpu_model_name: string
  os_version: string
  disk: NodeDisk
  gpus: NodeGpu[]
  memory: NodeMemory
}

export interface NodeLocation {
  city: string
  country: string
  latitude?: number
  longitude?: number
}

export interface NodePrices {
  /** Base price in Wei */
  base: number
  /** Storage price in Wei */
  storage: number
  /** Traffic price in Wei */
  traffic: number
}

export interface Node {
  id: number
  ip: string
  state: string
  osn: string
  uptime: number
  vrf_dt: string
  location: NodeLocation
  prices: NodePrices
  system: NodeSystem
}

/** Request body for PATCH /nodes/{id}/prices */
export interface UpdateNodePricesOptions {
  /** Base price in Wei */
  base: number
  /** Storage price in Wei */
  storage: number
  /** Traffic price in Wei */
  traffic: number
}

// ─── Node detail (GET /nodes/{id}) ──────────────────────────────────────────

export interface NodeDetailMemory {
  total_memory: number
  free_memory: number
  available_memory: number
  cached_memory: number
  buffered_memory: number
  total_swap: number
  free_swap: number
}

export interface NodeDetailData {
  arch: string
  cpu_cores: number
  cpu_load_percent: number
  cpu_model_name: string
  cpu_vendor_id: string
  cuda_version: string
  os_version: string
  is_hive_os: boolean
  is_wsl: boolean
  virt: string
  /** GPU passthrough enabled */
  gpu_pt: boolean
  /** Dominant GPU vendor */
  gpu_vendor: string
  gpu_driver_version?: string
  /**
   * GPU breakdown by vendor (legacy).
   * @deprecated Use `gpus` instead.
   */
  gpu?: Record<string, NodeGpu[]>
  /** GPU list */
  gpus: NodeGpu[]
  disk: NodeDisk
  memory: NodeDetailMemory
  kernel_version?: string
  linux_distro?: string
  linux_release?: string
  version: string
  uptime: number
}

export interface NodeDetailLocation extends NodeLocation {
  isocode?: string
  continent?: string
  continentcode?: string
  hostname?: string
  ip?: string
  organisation?: string
  provider?: string
  proxy?: string
  risk?: number
  type?: string
  devices?: Record<string, number>
}

export interface NodeReliability {
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

/** Detailed node info — returned by GET /nodes/{id} */
export interface NodeDetail {
  id: number
  state: string
  ip: string
  vrf_dt: string
  location: NodeDetailLocation
  reliability: NodeReliability
  features: string[]
  /** Full system information */
  data: NodeDetailData
}
