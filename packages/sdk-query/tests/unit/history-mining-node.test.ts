import type { OctaClient } from '@octaspace/sdk'
import { describe, expect, it, vi } from 'vitest'
import { hostingKeys, hostingQueries } from '../../src/queries/hosting.js'
import { networkKeys, networkQueries } from '../../src/queries/network.js'
import { statsKeys, statsQueries } from '../../src/queries/stats.js'
import { callQueryFn } from './helpers.js'

const makeClient = () =>
  ({
    hosting: { get: vi.fn().mockResolvedValue({}) },
    network: { history: vi.fn().mockResolvedValue({ timestamps: [] }) },
    stats: { mining: vi.fn().mockResolvedValue({}) },
  }) as unknown as OctaClient & {
    hosting: { get: ReturnType<typeof vi.fn> }
    network: { history: ReturnType<typeof vi.fn> }
    stats: { mining: ReturnType<typeof vi.fn> }
  }

describe('networkQueries.history', () => {
  it('uses a stable key for a Date and its Unix seconds', () => {
    expect(networkKeys.history({ start: new Date(1_000_000), step: 3600 })).toEqual(
      networkKeys.history({ start: 1000, step: 3600 }),
    )
    expect(networkKeys.history()).toEqual([
      '@octaspace',
      'network',
      'history',
      { start: undefined, end: undefined, step: undefined },
    ])
  })

  it('queryFn calls client.network.history() with the options and the signal', async () => {
    const client = makeClient()
    const { signal } = new AbortController()
    await callQueryFn(networkQueries.history(client, { step: 3600 }), { signal })
    expect(client.network.history).toHaveBeenCalledWith({ step: 3600 }, { signal })
  })
})

describe('hostingQueries.node', () => {
  it('keys by number and calls client.hosting.get()', async () => {
    const client = makeClient()
    const { signal } = new AbortController()
    const opts = hostingQueries.node(client, '7KQ4-M2XD-4')
    expect(opts.queryKey).toEqual(['@octaspace', 'hosting', 'node', '7KQ4-M2XD-4'])
    expect(opts.queryKey).toEqual(hostingKeys.node('7KQ4-M2XD-4'))
    await callQueryFn(opts, { signal })
    expect(client.hosting.get).toHaveBeenCalledWith('7KQ4-M2XD-4', { signal })
  })
})

describe('statsQueries.mining', () => {
  it('keys by role and days and calls client.stats.mining()', async () => {
    const client = makeClient()
    const { signal } = new AbortController()
    const opts = statsQueries.mining(client, { role: 'cpu', days: 7 })
    expect(opts.queryKey).toEqual(['@octaspace', 'stats', 'mining', { role: 'cpu', days: 7 }])
    expect(statsKeys.mining()).toEqual([
      '@octaspace',
      'stats',
      'mining',
      { role: undefined, days: undefined },
    ])
    await callQueryFn(opts, { signal })
    expect(client.stats.mining).toHaveBeenCalledWith({ role: 'cpu', days: 7 }, { signal })
  })
})
