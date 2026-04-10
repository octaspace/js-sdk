import { describe, expect, it, vi } from 'vitest'
import { makeClient, makeResponse } from './helpers.js'

const mockAccount = {
  account_uuid: 'uuid-1',
  avatar: 'https://example.com/avatar.png',
  balance: 1000000,
  email: 'test@example.com',
  ref_code: 'REF123',
  uid: 42,
  wallet: '0xabc123',
}

describe('AccountsResource', () => {
  it('get() returns account details', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse(mockAccount))
    const client = makeClient(mockFetch)
    const account = await client.accounts.get()

    expect(account.email).toBe('test@example.com')
    expect(account.uid).toBe(42)

    const [url] = mockFetch.mock.calls[0] as [string]
    expect(url).toContain('/accounts')
  })

  it('balance() returns balance', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse({ balance: 500 }))
    const client = makeClient(mockFetch)
    const result = await client.accounts.balance()

    expect(result.balance).toBe(500)
    const [url] = mockFetch.mock.calls[0] as [string]
    expect(url).toContain('/accounts/balance')
  })

  it('generateWallet() returns address via POST', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse({ address: '0xnew' }))
    const client = makeClient(mockFetch)
    const wallet = await client.accounts.generateWallet()

    expect(wallet.address).toBe('0xnew')
    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(init.method).toBe('POST')
  })
})
