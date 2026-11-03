import { describe, expect, it, vi } from 'vitest'
import type { AccountBalance } from '../../src/types/index.js'
import { loadFixture, makeClient, makeResponse, sentRequest } from './helpers.js'

describe('accounts.balance', () => {
  it('GETs /accounts/balance with the key and decodes micro-USD', async () => {
    const fixture = loadFixture<AccountBalance>('account_balance.json')
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse(fixture))
    const client = makeClient(mockFetch)

    const balance = await client.accounts.balance()
    expect(balance).toEqual(fixture)
    expect(balance.currency).toBe('USD')
    expect(balance.decimals).toBe(6)
    expect(sentRequest(mockFetch).url).toMatch(/\/accounts\/balance$/)
    expect(sentRequest(mockFetch).headers.get('Authorization')).toBe('Bearer octa_ak_test')
  })

  it('accepts a negative balance', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(makeResponse({ balance: -1250000, currency: 'USD', decimals: 6 }))
    const client = makeClient(mockFetch)

    await expect(client.accounts.balance()).resolves.toMatchObject({ balance: -1250000 })
  })
})
