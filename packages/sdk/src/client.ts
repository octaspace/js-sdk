import {
  DEFAULT_BASE_URL,
  DEFAULT_RETRIES,
  DEFAULT_TIMEOUT_MS,
  DEFAULT_USER_AGENT,
  type OctaClientOptions,
} from './config.js'
import type { RateLimit } from './errors/index.js'
import {
  AccountsResource,
  AppsResource,
  ComputeResource,
  IdleJobsResource,
  NetworkResource,
  NodesResource,
  RenderResource,
  ServicesResource,
  SessionsResource,
} from './resources/index.js'
import { HttpTransport } from './transport/http.js'

export class OctaClient {
  readonly accounts: AccountsResource
  readonly apps: AppsResource
  /** Compute machines: list, start, startBatch, restart */
  readonly compute: ComputeResource
  readonly network: NetworkResource
  readonly nodes: NodesResource
  /** Render nodes: list, start, startBatch */
  readonly render: RenderResource
  readonly services: ServicesResource
  readonly sessions: SessionsResource
  readonly idleJobs: IdleJobsResource

  private readonly transport: HttpTransport

  constructor(options: OctaClientOptions = {}) {
    const transport = new HttpTransport({
      baseUrls: options.baseUrls ?? [options.baseUrl ?? DEFAULT_BASE_URL],
      timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      retries: options.retries ?? DEFAULT_RETRIES,
      userAgent: options.userAgent ?? DEFAULT_USER_AGENT,
      ...(options.apiKey !== undefined && { apiKey: options.apiKey }),
      ...(options.fetch !== undefined && { fetch: options.fetch }),
      ...(options.onRequest !== undefined && { onRequest: options.onRequest }),
      ...(options.onResponse !== undefined && { onResponse: options.onResponse }),
    })

    this.transport = transport
    this.accounts = new AccountsResource(transport)
    this.apps = new AppsResource(transport)
    this.compute = new ComputeResource(transport)
    this.network = new NetworkResource(transport)
    this.nodes = new NodesResource(transport)
    this.render = new RenderResource(transport)
    this.services = new ServicesResource(transport)
    this.sessions = new SessionsResource(transport)
    this.idleJobs = new IdleJobsResource(transport)
  }

  /**
   * Rate limit state (`RateLimit-*` headers) from the most recent response that carried it, or
   * `undefined` before the first such response.
   */
  get rateLimit(): RateLimit | undefined {
    return this.transport.rateLimit
  }
}
