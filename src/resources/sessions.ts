import type { Session } from '../types/index.js'
import { BaseResource } from './base.js'

export interface ListSessionsOptions {
  /** Fetch recent sessions instead of active (default: false) */
  recent?: boolean
}

export class SessionsResource extends BaseResource {
  async list(options: ListSessionsOptions = {}): Promise<Session[]> {
    const res = await this.request<Session[]>({
      method: 'GET',
      path: '/sessions',
      query: { recent: options.recent },
    })
    return res.data
  }
}
