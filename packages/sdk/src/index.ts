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
  MrGpu,
  MrGpuByVendor,
  MrMachine,
  MrReliability,
  NetworkNodes,
  NetworkPower,
  NetworkStats,
  Node,
  NodeDetail,
  NodeDetailData,
  NodeDetailLocation,
  NodeDetailMemory,
  NodeDisk,
  NodeGpu,
  NodeLocation,
  NodeMemory,
  NodePrices,
  NodeReliability,
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

// Resource option types
export type { ListSessionsOptions } from './resources/sessions.js'
export type { RequestOverrides } from './resources/request-options.js'

// Transport context types (for hooks)
export type { RequestContext, ResponseContext } from './transport/types.js'
