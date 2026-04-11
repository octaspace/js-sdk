import type { ServiceInfo, SessionLogs } from '../../types/index.js'
import { BaseResource } from '../base.js'
import { type RequestOverrides, withRequestOverrides } from '../request-options.js'

export interface StopSessionOptions {
  /** Session score (1-5) */
  score?: number
}

export class SessionResource extends BaseResource {
  constructor(
    transport: ConstructorParameters<typeof BaseResource>[0],
    private readonly uuid: string,
  ) {
    super(transport)
  }

  async info(request?: RequestOverrides): Promise<ServiceInfo> {
    const res = await this.request<ServiceInfo>(
      withRequestOverrides({ method: 'GET', path: `/services/${this.uuid}/info` }, request),
    )
    return res.data
  }

  async logs(request?: RequestOverrides): Promise<SessionLogs> {
    const res = await this.request<SessionLogs>(
      withRequestOverrides({ method: 'GET', path: `/services/${this.uuid}/logs` }, request),
    )
    return res.data
  }

  async stop(options: StopSessionOptions = {}): Promise<void> {
    await this.request<unknown>({
      method: 'POST',
      path: `/services/${this.uuid}/stop`,
      body: options.score !== undefined ? { score: options.score } : undefined,
    })
  }
}
