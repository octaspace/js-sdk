import type { MrGpu, MrGpuByVendor, MrReliability } from './mr.js'

export interface RenderMachine {
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
  gpus: MrGpu[]
  /**
   * GPU breakdown by vendor.
   * @deprecated Use `gpus` instead.
   */
  gpu: MrGpuByVendor
  is_has_gpu: boolean
  ai_score: number
  blender_score: number
  /** Download speed in Mbps */
  net_down_mbits: number
  /** Upload speed in Mbps */
  net_up_mbits: number
  /** Total hourly price in USD (float) */
  total_price_usd: number
  total_price_wei: number
  total_price_ether: number
  base: number
  base_ether: number
  storage: number
  storage_ether: number
  traffic: number
  traffic_ether: number
  reliability: MrReliability
  features: string[]
  available_ports: number
}

export interface StartRenderOptions {
  node_id: number
  /** Disk allocation in GB */
  disk_size: number
  envs?: Record<string, string>
  /** One worker per GPU (default: false) */
  'multi-gpu-worker'?: boolean
}

export interface StartRenderResult {
  uuid: string
}
