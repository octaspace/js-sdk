// Client
export { OctaClient } from './client.js'
export type { OctaClientOptions } from './config.js'

// Errors
export {
  OctaApiError,
  OctaAuthenticationError,
  OctaError,
  OctaNetworkError,
  OctaNotFoundError,
  OctaPermissionError,
  OctaRateLimitError,
  OctaServerError,
  OctaTimeoutError,
  OctaValidationError,
} from './errors/index.js'

// Types
export type {
  Account,
  App,
  Balance,
  BlockchainInfo,
  IdleJob,
  IdleJobLogs,
  MrGpu,
  MrGpuByVendor,
  MrMachine,
  MrReliability,
  NetworkNodes,
  NetworkPower,
  NetworkStats,
  Node,
  NodeDisk,
  NodeGpu,
  NodeLocation,
  NodeMemory,
  NodePrices,
  NodeSystem,
  PortsMatrix,
  RenderMachine,
  ServiceInfo,
  ServiceKind,
  Session,
  SessionLogs,
  SessionNodeGpu,
  SessionNodeHw,
  SessionPrices,
  SshAccess,
  StartMrOptions,
  StartMrResult,
  StartRenderOptions,
  StartRenderResult,
  StartVpnOptions,
  StartVpnResult,
  SystemLogEntry,
  UpdateNodePricesOptions,
  VpnNode,
  VpnProtocol,
  VpnSubkind,
  Wallet,
} from './types/index.js'

// Transport context types (for hooks)
export type { RequestContext, ResponseContext } from './transport/types.js'
