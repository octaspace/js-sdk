import type { AccountBalance } from '../types/account.js'
import { BaseResource } from './base.js'
import { type RequestOverrides, withRequestOverrides } from './request-options.js'

/** The account the API key belongs to. */
export class AccountsResource extends BaseResource {
  /**
   * Account balance (`GET /accounts/balance`). Also a quick way to check that an API key is
   * valid.
   */
  async balance(request?: RequestOverrides): Promise<AccountBalance> {
    const res = await this.request<AccountBalance>(
      withRequestOverrides({ method: 'GET', path: '/accounts/balance' }, request),
    )
    return res.data
  }
}
