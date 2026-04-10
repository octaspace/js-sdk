import { describe, expect, it, vi } from 'vitest'
import { makeClient, makeResponse } from './helpers.js'

const mockVpnNode = {
  node_id: 11,
  country: 'Netherlands',
  country_iso: 'NL',
  city: 'Amsterdam',
  latitude: 52.37,
  longitude: 4.9,
  net_down_mbs: 500,
  net_up_mbs: 500,
  residential: false,
  traffic_price_usd: 0.05,
  traffic_price_ether: 0.00003,
}

describe('VpnService', () => {
  it('available() returns vpn node list', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse([mockVpnNode]))
    const client = makeClient(mockFetch)
    const nodes = await client.services.vpn.available()

    expect(nodes[0]?.country_iso).toBe('NL')
    const [url] = mockFetch.mock.calls[0] as [string]
    expect(url).toContain('/services/vpn')
  })

  it('start() with wg subkind sends correct POST', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse({ uuid: 'sess-vpn-1' }))
    const client = makeClient(mockFetch)
    const result = await client.services.vpn.start({ node_id: 11, subkind: 'wg' })

    expect(result.uuid).toBe('sess-vpn-1')
    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(init.body).toContain('"subkind":"wg"')
  })

  it('start() with v2ray + protocol', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse({ uuid: 'sess-vpn-2' }))
    const client = makeClient(mockFetch)
    await client.services.vpn.start({ node_id: 11, subkind: 'v2ray', protocol: 'vmess' })

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(init.body).toContain('"protocol":"vmess"')
  })
})
