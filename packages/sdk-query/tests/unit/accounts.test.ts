import type { OctaClient } from '@octaspace/sdk'
import { describe, expect, it, vi } from 'vitest'
import { accountKeys, accountQueries } from '../../src/queries/accounts.js'
import { callQueryFn } from './helpers.js'

const makeClient = () =>
  ({
    accounts: {
      get: vi.fn().mockResolvedValue({ id: '1', email: 'test@example.com' }),
      balance: vi.fn().mockResolvedValue({ amount: 100, currency: 'OCTA' }),
    },
  }) as unknown as OctaClient

describe('accountKeys', () => {
  it('produces stable query keys', () => {
    expect(accountKeys.all()).toEqual(['@octaspace', 'accounts'])
    expect(accountKeys.detail()).toEqual(['@octaspace', 'accounts', 'detail'])
    expect(accountKeys.balance()).toEqual(['@octaspace', 'accounts', 'balance'])
  })
})

describe('accountQueries.detail', () => {
  it('sets the correct queryKey', () => {
    const opts = accountQueries.detail(makeClient())
    expect(opts.queryKey).toEqual(accountKeys.detail())
  })

  it('queryFn calls client.accounts.get()', async () => {
    const client = makeClient()
    await callQueryFn(accountQueries.detail(client))
    expect(client.accounts.get).toHaveBeenCalledOnce()
  })
})

describe('accountQueries.balance', () => {
  it('sets the correct queryKey', () => {
    const opts = accountQueries.balance(makeClient())
    expect(opts.queryKey).toEqual(accountKeys.balance())
  })

  it('queryFn calls client.accounts.balance()', async () => {
    const client = makeClient()
    await callQueryFn(accountQueries.balance(client))
    expect(client.accounts.balance).toHaveBeenCalledOnce()
  })
})
