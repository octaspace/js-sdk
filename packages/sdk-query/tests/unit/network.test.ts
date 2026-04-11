import type { OctaClient } from '@octaspace/sdk'
import { describe, expect, it, vi } from 'vitest'
import { networkKeys, networkQueries } from '../../src/queries/network.js'
import { callQueryFn } from './helpers.js'

const makeClient = () =>
  ({
    network: {
      get: vi.fn().mockResolvedValue({ nodes: 0, power: 0 }),
    },
  }) as unknown as OctaClient

describe('networkKeys', () => {
  it('produces stable query keys', () => {
    expect(networkKeys.all()).toEqual(['@octaspace', 'network'])
    expect(networkKeys.stats()).toEqual(['@octaspace', 'network', 'stats'])
  })
})

describe('networkQueries.stats', () => {
  it('sets the correct queryKey', () => {
    const opts = networkQueries.stats(makeClient())
    expect(opts.queryKey).toEqual(networkKeys.stats())
  })

  it('queryFn calls client.network.get()', async () => {
    const client = makeClient()
    await callQueryFn(networkQueries.stats(client))
    expect(client.network.get).toHaveBeenCalledOnce()
  })
})
