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
  OctaSessionStoppedError,
  OctaTimeoutError,
  OctaValidationError,
  type RateLimit,
} from './errors/index.js'
// Resource option types
export type { RequestOverrides } from './resources/request-options.js'
// Helpers
export { isComputeSession, isRenderSession } from './resources/sessions.js'
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
  ComputeSession,
  ComputeSessionNodeHw,
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
  Reliability,
  RenderBatchItem,
  RenderMachine,
  RenderSession,
  RenderStartParams,
  Session,
  SessionBase,
  SessionLogs,
  SessionLogsOptions,
  SessionSsh,
  SessionStatus,
  SshEndpoint,
  StartResult,
  StartVpnOptions,
  StartVpnResult,
  SystemLogEvent,
  UpdateNodePricesOptions,
  UserEnvs,
  VpnNode,
  VpnProtocol,
  VpnSubkind,
  WaitOptions,
  WaitReadyOptions,
  Wallet,
} from './types/index.js'
export { formatUsd, MICRO_USD_PER_USD, microUsdToUsd, usdToMicroUsd } from './utils/money.js'
