import { describe, expect, it, vi } from 'vitest'
import { OctaValidationError } from '../../src/errors/index.js'
import type { VpnMachine } from '../../src/types/index.js'
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
    // @ts-expect-error -- `protocol` is for v2ray only; extra fields are dropped at runtime too
    await expect(client.vpn.start(params)).resolves.toEqual({ uuid: 'v-1' })
    expect(sentRequest(mockFetch).method).toBe('POST')
    expect(sentRequest(mockFetch).url).toMatch(/\/services\/vpn$/)
    expect(sentBody(mockFetch)).toEqual({ node_number: '7KQ4-M2XD-4', subkind: 'wg' })
  })

  it('sends protocol with v2ray, and omits it when not set', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(makeResponse({ uuid: 'v-1' }, 201))
      .mockResolvedValueOnce(makeResponse({ uuid: 'v-2' }, 201))
    const client = makeClient(mockFetch)

    await client.vpn.start({ node_number: 'N', subkind: 'v2ray', protocol: 'vless' })
    await client.vpn.start({ node_number: 'N', subkind: 'v2ray' })
    expect(sentBody(mockFetch, 0)).toEqual({
      node_number: 'N',
      subkind: 'v2ray',
      protocol: 'vless',
    })
    expect(sentBody(mockFetch, 1)).toEqual({ node_number: 'N', subkind: 'v2ray' })
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
