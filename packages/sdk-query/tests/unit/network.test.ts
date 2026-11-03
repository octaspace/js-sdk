import type { OctaClient } from '@octaspace/sdk'
import { describe, expect, it, vi } from 'vitest'
import { networkKeys, networkQueries } from '../../src/queries/network.js'
import { callQueryFn } from './helpers.js'

describe('networkQueries.info', () => {
  it('uses a stable key and calls client.network.info()', async () => {
    const info = vi.fn().mockResolvedValue({ at: 1 })
    const client = { network: { info } } as unknown as OctaClient

    const opts = networkQueries.info(client)
    expect(opts.queryKey).toEqual(['@octaspace', 'network', 'info'])
    expect(networkKeys.all()).toEqual(['@octaspace', 'network'])
    await callQueryFn(opts)
    expect(info).toHaveBeenCalledWith(undefined)
  })
})
