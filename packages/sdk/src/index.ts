// Client
export { OctaClient } from './client.js'
export { BASE_URL_DEV, type OctaClientOptions } from './config.js'

// Errors
export {
  OctaApiError,
  type OctaApiErrorDetails,
  OctaAuthenticationError,
  OctaConflictError,
  OctaError,
  OctaNetworkError,
  OctaNotFoundError,
  OctaPermissionError,
  OctaRateLimitError,
  OctaServerError,
  OctaServiceUnavailableError,
  OctaTimeoutError,
  OctaValidationError,
  type RateLimit,
} from './errors/index.js'
// Resource option types
export type { RequestOverrides } from './resources/request-options.js'
export type { ListSessionsOptions } from './resources/sessions.js'
// Transport context types (for hooks)
export type { RequestContext, ResponseContext } from './transport/types.js'
// Types
export type {
  Account,
  App,
  Balance,
  BatchId,
  BatchResult,
  BlockchainInfo,
  ComputeBatchItem,
  ComputeMachine,
  ComputeRestartParams,
  ComputeStartParams,
  IdleJob,
  MachineGpu,
  MicroUsd,
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
  NodeNumber,
  NodePrices,
  NodeReliability,
  NodeSystem,
  PortsMatrix,
  ProxyConfig,
  Reliability,
  RenderBatchItem,
  RenderMachine,
  RenderStartParams,
  ServiceInfo,
  ServiceKind,
  Session,
  SessionLogs,
  SessionNodeGpu,
  SessionNodeHw,
  SessionPrices,
  SshAccess,
  StartResult,
  StartVpnOptions,
  StartVpnResult,
  SystemLogEntry,
  UpdateNodePricesOptions,
  UserEnvs,
  VpnNode,
  VpnProtocol,
  VpnSubkind,
  Wallet,
} from './types/index.js'

// Helpers
export { formatUsd, MICRO_USD_PER_USD, microUsdToUsd, usdToMicroUsd } from './utils/money.js'
