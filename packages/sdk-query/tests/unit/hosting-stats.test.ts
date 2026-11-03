import type { OctaClient } from '@octaspace/sdk'
import { describe, expect, it, vi } from 'vitest'
import { hostingKeys, hostingQueries } from '../../src/queries/hosting.js'
import { statsKeys, statsQueries } from '../../src/queries/stats.js'
import { callQueryFn } from './helpers.js'

const makeClient = () =>
  ({
    hosting: { nodes: vi.fn().mockResolvedValue([]) },
    stats: {
      gpuCurrent: vi.fn().mockResolvedValue({ at: 1, gpus: [] }),
      gpuHistory: vi.fn().mockResolvedValue({}),
      gpuLocations: vi.fn().mockResolvedValue([]),
    },
  }) as unknown as OctaClient & {
    hosting: { nodes: ReturnType<typeof vi.fn> }
    stats: Record<'gpuCurrent' | 'gpuHistory' | 'gpuLocations', ReturnType<typeof vi.fn>>
  }

describe('hostingQueries.nodes', () => {
  it('uses a stable key and forwards the signal', async () => {
    const client = makeClient()
    const { signal } = new AbortController()
    const opts = hostingQueries.nodes(client)
    expect(opts.queryKey).toEqual(['@octaspace', 'hosting', 'nodes'])
    expect(hostingKeys.all()).toEqual(['@octaspace', 'hosting'])
    await callQueryFn(opts, { signal })
    expect(client.hosting.nodes).toHaveBeenCalledWith({ signal })
  })
})

describe('statsQueries', () => {
  it('gpuCurrent keys by the verified filter', async () => {
    const client = makeClient()
    const opts = statsQueries.gpuCurrent(client, { verified: 'yes' })
    expect(opts.queryKey).toEqual(['@octaspace', 'stats', 'gpu', 'current', { verified: 'yes' }])
    expect(statsKeys.gpuCurrent()).not.toEqual(statsKeys.gpuCurrent({ verified: 'no' }))
    await callQueryFn(opts)
    expect(client.stats.gpuCurrent).toHaveBeenCalledWith({ verified: 'yes' }, undefined)
  })

  it('gpuHistory gives equal keys to equal requests', async () => {
    const client = makeClient()
    const a = statsKeys.gpuHistory({ gpuName: ['A', 'B'], start: new Date(10_000), step: 300 })
    const b = statsKeys.gpuHistory({ gpuName: 'A,B', start: 10, step: 300 })
    expect(a).toEqual(b)

    const opts = statsQueries.gpuHistory(client, { step: 3600 })
    await callQueryFn(opts)
    expect(client.stats.gpuHistory).toHaveBeenCalledWith({ step: 3600 }, undefined)
  })

  it('gpuLocations calls client.stats.gpuLocations()', async () => {
    const client = makeClient()
    const opts = statsQueries.gpuLocations(client)
    expect(opts.queryKey).toEqual(['@octaspace', 'stats', 'gpu', 'locations'])
    await callQueryFn(opts)
    expect(client.stats.gpuLocations).toHaveBeenCalledOnce()
  })
})
