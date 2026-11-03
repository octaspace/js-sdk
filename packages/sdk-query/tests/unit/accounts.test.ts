import type { OctaClient } from '@octaspace/sdk'
import { describe, expect, it, vi } from 'vitest'
import { accountKeys, accountQueries } from '../../src/queries/accounts.js'
import { callQueryFn } from './helpers.js'

describe('accountQueries.balance', () => {
  it('uses a stable key and forwards the signal', async () => {
    const balance = vi.fn().mockResolvedValue({ balance: 1, currency: 'USD', decimals: 6 })
    const client = { accounts: { balance } } as unknown as OctaClient
    const { signal } = new AbortController()

    const opts = accountQueries.balance(client)
    expect(accountKeys.all()).toEqual(['@octaspace', 'accounts'])
    expect(opts.queryKey).toEqual(['@octaspace', 'accounts', 'balance'])
    await callQueryFn(opts, { signal })
    expect(balance).toHaveBeenCalledWith({ signal })
  })
})
