import {
  DEFAULT_APP,
  DEFAULT_BASE_URL,
  DEFAULT_RETRIES,
  DEFAULT_TIMEOUT_MS,
  DEFAULT_USER_AGENT,
  type OctaClientOptions,
} from './config.js'
import type { RateLimit } from './errors/index.js'
import {
  AccountsResource,
  ComputeResource,
  HostingResource,
  NetworkResource,
  RenderResource,
  SessionsResource,
  StatsResource,
  VpnResource,
} from './resources/index.js'
import { HttpTransport } from './transport/http.js'

/**
 * Client of the OctaSpace API.
 *
 * ```ts
 * const client = new OctaClient({ apiKey: process.env.OCTA_API_KEY })
 * const machines = await client.compute.list()
 * ```
 *
 * Every option is optional: without `apiKey` only network and GPU statistics and the machine
 * listings work, and the base URL defaults to {@link DEFAULT_BASE_URL}.
 */
export class OctaClient {
  /** Account: balance */
  readonly accounts: AccountsResource
  /** Compute machines and apps: list, apps, start, startBatch, restart */
  readonly compute: ComputeResource
  /** Account nodes, their prices and maintenance: nodes, get, setPrices, setMaintenance */
  readonly hosting: HostingResource
  /** Platform statistics: info, history */
  readonly network: NetworkResource
  /** Render nodes: list, start, startBatch */
  readonly render: RenderResource
  /** Running sessions: list, get, logs, stop, waitReady, waitStopped */
  readonly sessions: SessionsResource
  /** GPU market and mining statistics: gpuCurrent, gpuHistory, gpuLocations, mining */
  readonly stats: StatsResource
  /** VPN nodes: list, start */
  readonly vpn: VpnResource

  private readonly transport: HttpTransport

  constructor(options: OctaClientOptions = {}) {
    this.transport = new HttpTransport({
      baseUrls: options.baseUrls ?? [options.baseUrl ?? DEFAULT_BASE_URL],
      timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      retries: options.retries ?? DEFAULT_RETRIES,
      userAgent: options.userAgent ?? DEFAULT_USER_AGENT,
      app: options.app?.trim() || DEFAULT_APP,
      ...(options.apiKey !== undefined && { apiKey: options.apiKey }),
      ...(options.fetch !== undefined && { fetch: options.fetch }),
      ...(options.onRequest !== undefined && { onRequest: options.onRequest }),
      ...(options.onResponse !== undefined && { onResponse: options.onResponse }),
    })

    this.accounts = new AccountsResource(this.transport)
    this.compute = new ComputeResource(this.transport)
    this.hosting = new HostingResource(this.transport)
    this.network = new NetworkResource(this.transport)
    this.render = new RenderResource(this.transport)
    this.sessions = new SessionsResource(this.transport)
    this.stats = new StatsResource(this.transport)
    this.vpn = new VpnResource(this.transport)
  }

  /**
   * Rate limit state (`RateLimit-*` headers) from the most recent response that carried it, or
   * `undefined` before the first such response.
   */
  get rateLimit(): RateLimit | undefined {
    return this.transport.rateLimit
  }
}
