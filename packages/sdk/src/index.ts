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
export { gpuHistoryPoints } from './resources/stats.js'
// Transport context types (for hooks)
export type { RequestContext, ResponseContext } from './transport/types.js'
// Types
export type {
  AccountBalance,
  App,
  BatchId,
  BatchResult,
  ComputeBatchItem,
  ComputeMachine,
  ComputeRestartParams,
  ComputeSession,
  ComputeSessionNodeHw,
  ComputeStartParams,
  GpuCurrent,
  GpuCurrentOptions,
  GpuHistory,
  GpuHistoryOptions,
  GpuHistoryPoint,
  GpuLocation,
  GpuModelHistory,
  GpuModelStats,
  GpuPricePercentiles,
  GpuPriceSeries,
  GpuVerifiedFilter,
  HostingNode,
  HostingNodePrices,
  HostingNodeStatus,
  HostingNodeUsage,
  IdleJob,
  MachineGpu,
  MicroUsd,
  NetworkInfo,
  NodeNumber,
  NodePrices,
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
  UserEnvs,
  VpnNode,
  VpnProtocol,
  VpnSubkind,
  WaitOptions,
  WaitReadyOptions,
} from './types/index.js'
export { formatUsd, MICRO_USD_PER_USD, microUsdToUsd, usdToMicroUsd } from './utils/money.js'
