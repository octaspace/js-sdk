import type { Account, Balance, Wallet } from '../types/index.js'
import { BaseResource } from './base.js'

export class AccountsResource extends BaseResource {
  async get(): Promise<Account> {
    const res = await this.request<Account>({ method: 'GET', path: '/accounts' })
    return res.data
  }

  async balance(): Promise<Balance> {
    const res = await this.request<Balance>({ method: 'GET', path: '/accounts/balance' })
    return res.data
  }

  async generateWallet(): Promise<Wallet> {
    const res = await this.request<Wallet>({ method: 'POST', path: '/accounts' })
    return res.data
  }
}
