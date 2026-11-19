import type { OctaClient } from '@octaspace/sdk'
import { describe, expect, it, vi } from 'vitest'
import { computeKeys, computeQueries } from '../../src/queries/compute.js'
import { vpnKeys, vpnQueries } from '../../src/queries/vpn.js'
import { callQueryFn } from './helpers.js'

const makeClient = () =>
  ({
    compute: { apps: vi.fn().mockResolvedValue([]) },
    vpn: { list: vi.fn().mockResolvedValue([]) },
  }) as unknown as OctaClient & {
    compute: { apps: ReturnType<typeof vi.fn> }
    vpn: { list: ReturnType<typeof vi.fn> }
  }

describe('vpnKeys', () => {
  it('produces stable query keys', () => {
    expect(vpnKeys.all()).toEqual(['@octaspace', 'vpn'])
    expect(vpnKeys.list()).toEqual(['@octaspace', 'vpn', 'list'])
  })
})

describe('vpnQueries.list', () => {
  it('queryFn calls client.vpn.list() with the query signal', async () => {
    const client = makeClient()
    const { signal } = new AbortController()
    const opts = vpnQueries.list(client)
    expect(opts.queryKey).toEqual(vpnKeys.list())
    await callQueryFn(opts, { signal })
    expect(client.vpn.list).toHaveBeenCalledWith({ signal })
  })
})

describe('computeQueries.apps', () => {
  it('uses computeKeys.apps() and passes the query signal', async () => {
    const client = makeClient()
    const { signal } = new AbortController()
    const opts = computeQueries.apps(client)
    expect(opts.queryKey).toEqual(['@octaspace', 'compute', 'apps'])
    expect(opts.queryKey).toEqual(computeKeys.apps())
    await callQueryFn(opts, { signal })
    expect(client.compute.apps).toHaveBeenCalledWith({ signal })
  })
})
