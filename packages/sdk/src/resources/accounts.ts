import type { Account, Balance, Wallet } from '../types/index.js'
import { BaseResource } from './base.js'
import { type RequestOverrides, withRequestOverrides } from './request-options.js'

export class AccountsResource extends BaseResource {
  async get(request?: RequestOverrides): Promise<Account> {
    const res = await this.request<Account>(
      withRequestOverrides({ method: 'GET', path: '/accounts' }, request),
    )
    return res.data
  }

  async balance(request?: RequestOverrides): Promise<Balance> {
    const res = await this.request<Balance>(
      withRequestOverrides({ method: 'GET', path: '/accounts/balance' }, request),
    )
    return res.data
  }

  async generateWallet(): Promise<Wallet> {
    const res = await this.request<Wallet>({ method: 'POST', path: '/accounts' })
    return res.data
  }
}
