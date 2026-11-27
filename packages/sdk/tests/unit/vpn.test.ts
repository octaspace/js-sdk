import { describe, expect, it, vi } from 'vitest'
import { OctaValidationError } from '../../src/errors/index.js'
import { isVpnSession } from '../../src/resources/sessions.js'
import type { VpnMachine, VpnSession } from '../../src/types/index.js'
import {
  loadFixture,
  makeClient,
  makeErrorResponse,
  makeResponse,
  sentBody,
  sentRequest,
} from './helpers.js'

describe('vpn.list', () => {
  it('GETs /services/vpn without a key when the client has none, and decodes the listing', async () => {
    const fixture = loadFixture<VpnMachine[]>('services_vpn.json')
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse(fixture))
    const client = makeClient(mockFetch, { apiKey: null })

    const nodes = await client.vpn.list()
    expect(sentRequest(mockFetch).method).toBe('GET')
    expect(sentRequest(mockFetch).url).toMatch(/\/services\/vpn$/)
    expect(sentRequest(mockFetch).headers.has('Authorization')).toBe(false)
    expect(nodes).toHaveLength(fixture.length)
    expect(nodes[0]?.node_number).toMatch(/^[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]$/)
    expect(nodes[0]?.protocols).toContain('wg')
    expect(Number.isInteger(nodes[0]?.traffic_price)).toBe(true)
  })

  it('sends the key when the client has one', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse([]))
    const client = makeClient(mockFetch)

    await client.vpn.list()
    expect(sentRequest(mockFetch).headers.get('Authorization')).toBe('Bearer octa_ak_test')
  })

  it('turns "null" strings into null', async () => {
    const node = {
      node_number: '7KQ4-M2XD-4',
      traffic_price: 100,
      protocols: ['wg'],
      country: 'null',
    }
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse([node]))
    const client = makeClient(mockFetch)

    const [out] = await client.vpn.list()
    expect(out?.country).toBeNull()
  })
})

describe('vpn.start', () => {
  it('POSTs the node number and subkind only', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse({ uuid: 'v-1' }, 201))
    const client = makeClient(mockFetch)

    const params = { node_number: '7KQ4-M2XD-4', subkind: 'wg', protocol: 'vless', x: 1 }
    // @ts-expect-error -- extra fields are not part of the params and are not sent
    await expect(client.vpn.start(params)).resolves.toEqual({ uuid: 'v-1' })
    expect(sentRequest(mockFetch).method).toBe('POST')
    expect(sentRequest(mockFetch).url).toMatch(/\/services\/vpn$/)
    expect(sentBody(mockFetch)).toEqual({ node_number: '7KQ4-M2XD-4', subkind: 'wg' })
  })

  it('starts an HTTP proxy, whose session config is its address and login', async () => {
    const ready = { ...loadFixture<VpnSession>('session_vpn_http_proxy.json') }
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(makeResponse({ uuid: ready.uuid }, 201))
      .mockResolvedValueOnce(makeResponse(ready))
    const client = makeClient(mockFetch)

    const { uuid } = await client.vpn.start({ node_number: 'N', subkind: 'http_proxy' })
    const session = await client.sessions.get(uuid)
    expect(sentBody(mockFetch, 0)).toEqual({ node_number: 'N', subkind: 'http_proxy' })
    expect(isVpnSession(session) && session.config).toEqual({
      ip: '203.0.113.7',
      port: 40000,
      username: 'a1b2c3d4',
      password: 'tt1f70D8qUUknMdlHoIUyp3Q',
    })
  })

  it('fails before fetch without a key', async () => {
    const mockFetch = vi.fn()
    const client = makeClient(mockFetch, { apiKey: null })

    await expect(client.vpn.start({ node_number: 'N', subkind: 'wg' })).rejects.toThrow()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('throws OctaValidationError with the API message', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValue(
        makeErrorResponse({ message: 'You already have a VPN session on this node' }, 400),
      )
    const client = makeClient(mockFetch)

    const err = await client.vpn.start({ node_number: 'N', subkind: 'awg' }).catch((e) => e)
    expect(err).toBeInstanceOf(OctaValidationError)
    expect(err.message).toBe('You already have a VPN session on this node')
  })

  it('is never retried, even on 503', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValue(makeErrorResponse({ message: 'Service is temporarily unavailable' }, 503))
    const client = makeClient(mockFetch, { retries: 3 })

    await expect(client.vpn.start({ node_number: 'N', subkind: 'wg' })).rejects.toThrow()
    expect(mockFetch).toHaveBeenCalledOnce()
  })
})
