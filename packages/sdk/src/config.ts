import type { RequestContext, ResponseContext } from './transport/types.js'

export const DEFAULT_BASE_URL = 'https://api.octa.computer'
export const DEFAULT_TIMEOUT_MS = 30_000
export const DEFAULT_RETRIES = 2
declare const __SDK_VERSION__: string | undefined
/** SDK version — injected by tsup at build time, falls back to '0.0.0-dev' */
export const SDK_VERSION = typeof __SDK_VERSION__ !== 'undefined' ? __SDK_VERSION__ : '0.0.0-dev'
export const DEFAULT_USER_AGENT = `@octaspace/sdk/${SDK_VERSION} (js)`

export interface OctaClientOptions {
  /** API key for authentication */
  apiKey: string
  /** API base URL (default: https://api.octa.computer) */
  baseUrl?: string
  /** Request timeout in milliseconds (default: 30000) */
  timeoutMs?: number
  /** Number of automatic retries for safe methods (default: 2) */
  retries?: number
  /** Custom fetch implementation (useful for testing or proxying) */
  fetch?: typeof globalThis.fetch
  /** Custom User-Agent string */
  userAgent?: string
  /** Hook called before each request */
  onRequest?: (ctx: RequestContext) => void | Promise<void>
  /** Hook called after each response */
  onResponse?: (ctx: ResponseContext) => void | Promise<void>
}
