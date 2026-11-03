import type { OctaClient } from '@octaspace/sdk'
import { describe, expect, it, vi } from 'vitest'
import { vpnKeys, vpnQueries } from '../../src/queries/services.js'
import { callQueryFn } from './helpers.js'

const makeClient = () =>
  ({
    services: { vpn: { available: vi.fn().mockResolvedValue([]) } },
  }) as unknown as OctaClient

describe('vpnKeys', () => {
  it('produces stable query keys', () => {
    expect(vpnKeys.all()).toEqual(['@octaspace', 'services', 'vpn'])
    expect(vpnKeys.available()).toEqual(['@octaspace', 'services', 'vpn', 'available'])
  })
})

describe('vpnQueries.available', () => {
  it('sets the correct queryKey', () => {
    const opts = vpnQueries.available(makeClient())
    expect(opts.queryKey).toEqual(vpnKeys.available())
  })

  it('queryFn calls client.services.vpn.available()', async () => {
    const client = makeClient()
    await callQueryFn(vpnQueries.available(client))
    expect(client.services.vpn.available).toHaveBeenCalledOnce()
  })
})
