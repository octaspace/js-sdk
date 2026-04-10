export interface BlockchainInfo {
  /** Current block height */
  height: number
  difficulty: number
  hashrate: number
  total_supply: number
  era: number
  blocktime: number
}

export interface NetworkNodes {
  count: number
  /** VPN node count */
  vpn: number
}

export interface NetworkPower {
  /** Total CPUs across all nodes */
  cpus: number
  /** Total GPUs across all nodes */
  gpus: number
  /** Total disk in bytes */
  disk: number
  /** Total memory in bytes */
  mem: number
}

export interface NetworkStats {
  blockchain: BlockchainInfo
  market_price: number
  /** Monthly staking ROI percentage */
  mmROI: number
  nodes: NetworkNodes
  power: NetworkPower
  /** Staked coins */
  staked: number
}
