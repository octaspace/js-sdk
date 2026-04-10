import { describe, expect, it, vi } from 'vitest'
import { makeClient, makeResponse } from './helpers.js'

const mockNetworkStats = {
  blockchain: {
    height: 100000,
    difficulty: 1234,
    hashrate: 9999,
    total_supply: 21000000,
    era: 3,
    blocktime: 60,
  },
  market_price: 1.25,
  mmROI: 8.5,
  nodes: { count: 500, vpn: 120 },
  power: { cpus: 10000, gpus: 2000, disk: 1e12, mem: 5e11 },
  staked: 5000000,
}

describe('NetworkResource', () => {
  it('get() returns network stats', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse(mockNetworkStats))
    const client = makeClient(mockFetch)
    const stats = await client.network.get()

    expect(stats.market_price).toBe(1.25)
    expect(stats.nodes.count).toBe(500)
    expect(stats.nodes.vpn).toBe(120)
  })

  it('get() does NOT send Authorization header (public endpoint)', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse(mockNetworkStats))
    const client = makeClient(mockFetch, { apiKey: 'secret_key' })
    await client.network.get()

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit]
    const headers = init.headers as Headers
    expect(headers.get('Authorization')).toBeNull()
  })
})
