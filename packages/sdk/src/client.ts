import {
  DEFAULT_BASE_URL,
  DEFAULT_RETRIES,
  DEFAULT_TIMEOUT_MS,
  DEFAULT_USER_AGENT,
  type OctaClientOptions,
} from './config.js'
import {
  AccountsResource,
  AppsResource,
  IdleJobsResource,
  NetworkResource,
  NodesResource,
  ServicesResource,
  SessionsResource,
} from './resources/index.js'
import { HttpTransport } from './transport/http.js'

export class OctaClient {
  readonly accounts: AccountsResource
  readonly apps: AppsResource
  readonly network: NetworkResource
  readonly nodes: NodesResource
  readonly services: ServicesResource
  readonly sessions: SessionsResource
  readonly idleJobs: IdleJobsResource

  constructor(options: OctaClientOptions) {
    const transport = new HttpTransport({
      baseUrl: options.baseUrl ?? DEFAULT_BASE_URL,
      timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      retries: options.retries ?? DEFAULT_RETRIES,
      userAgent: options.userAgent ?? DEFAULT_USER_AGENT,
      ...(options.apiKey !== undefined && { apiKey: options.apiKey }),
      ...(options.fetch !== undefined && { fetch: options.fetch }),
      ...(options.onRequest !== undefined && { onRequest: options.onRequest }),
      ...(options.onResponse !== undefined && { onResponse: options.onResponse }),
    })

    this.accounts = new AccountsResource(transport)
    this.apps = new AppsResource(transport)
    this.network = new NetworkResource(transport)
    this.nodes = new NodesResource(transport)
    this.services = new ServicesResource(transport)
    this.sessions = new SessionsResource(transport)
    this.idleJobs = new IdleJobsResource(transport)
  }
}
