// Client and configuration
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

// Per-request overrides and hook contexts
export type { RequestOverrides } from './resources/request-options.js'
// Helpers
export { isComputeSession, isRenderSession } from './resources/sessions.js'
export { gpuHistoryPoints } from './resources/stats.js'
export type { RequestContext, ResponseContext } from './transport/types.js'
// API models and method options
export type * from './types/index.js'
export { formatUsd, MICRO_USD_PER_USD, microUsdToUsd, usdToMicroUsd } from './utils/money.js'
