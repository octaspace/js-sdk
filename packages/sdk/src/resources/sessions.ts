import type { Session } from '../types/index.js'
import { BaseResource } from './base.js'
import { type RequestOverrides, withRequestOverrides } from './request-options.js'

export interface ListSessionsOptions {
  /** Fetch recent sessions instead of active (default: false) */
  recent?: boolean
}

export class SessionsResource extends BaseResource {
  async list(options: ListSessionsOptions = {}, request?: RequestOverrides): Promise<Session[]> {
    const res = await this.request<Session[]>(
      withRequestOverrides(
        {
          method: 'GET',
          path: '/sessions',
          query: { recent: options.recent },
        },
        request,
      ),
    )
    return res.data
  }
}
