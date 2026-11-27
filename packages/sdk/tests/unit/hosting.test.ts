import { describe, expect, it, vi } from 'vitest'
import { OctaNotFoundError, OctaValidationError } from '../../src/errors/index.js'
import type { HostingNode } from '../../src/types/index.js'
import { usdToMicroUsd } from '../../src/utils/money.js'
import {
  loadFixture,
  makeClient,
  makeErrorResponse,
  makeResponse,
  sentBody,
  sentRequest,
} from './helpers.js'

describe('hosting.nodes', () => {
  it('GETs /hosting/nodes and turns "null" strings into null', async () => {
    const fixture = loadFixture<HostingNode[]>('hosting_nodes.json')
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse(fixture))
    const client = makeClient(mockFetch)

    const nodes = await client.hosting.nodes()
    expect(sentRequest(mockFetch).url).toMatch(/\/hosting\/nodes$/)
    expect(nodes.length).toBeGreaterThan(0)

    const node = nodes[0] as HostingNode
    expect(node.number).toMatch(/^[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]$/)
    expect(typeof node.prices.base).toBe('number')
    expect(typeof node.prices.min_rent_minutes).toBe('number')

    const gpuValues = nodes.flatMap((n) => n.system.gpus ?? []).flatMap((g) => Object.values(g))
    expect(gpuValues).not.toContain('null')
    expect(gpuValues).toContain(null)
  })
})

describe('hosting.setPrices', () => {
  it('PATCHes only the fields that are set and accepts 204', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(new Response(null, { status: 204 }))
    const client = makeClient(mockFetch)

    await expect(
      client.hosting.setPrices('7kq4m2xd4', {
        base: usdToMicroUsd(0.25),
        min_rent_minutes: 15,
        traffic: undefined,
      }),
    ).resolves.toBeUndefined()

    const { method, url } = sentRequest(mockFetch)
    expect(method).toBe('PATCH')
    expect(url).toMatch(/\/hosting\/nodes\/7kq4m2xd4\/prices$/)
    expect(sentBody(mockFetch)).toEqual({ base: 250000, min_rent_minutes: 15 })
  })

  it('refuses an empty update or non-integers before sending', async () => {
    const mockFetch = vi.fn()
    const client = makeClient(mockFetch)

    await expect(client.hosting.setPrices('N', {})).rejects.toBeInstanceOf(TypeError)
    await expect(client.hosting.setPrices('N', { base: 0.25 })).rejects.toThrow(/integer/)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('surfaces API validation and unknown nodes', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(
        makeErrorResponse({ message: 'base must be an integer between 100 and 1000000000' }, 400),
      )
      .mockResolvedValueOnce(makeErrorResponse({ message: 'Node not found' }, 404))
    const client = makeClient(mockFetch)

    await expect(client.hosting.setPrices('N', { base: 1 })).rejects.toBeInstanceOf(
      OctaValidationError,
    )
    await expect(client.hosting.setPrices('0000-0000-0', { base: 100 })).rejects.toBeInstanceOf(
      OctaNotFoundError,
    )
  })
})

describe('hosting.nodes VPN offer', () => {
  it('keeps the per-protocol offer of a VPN node', async () => {
    const node = {
      number: '7KQ4-M2XD-4',
      status: 'idle',
      services: {
        vpn: {
          offered: true,
          reason: null,
          protocols: {
            wg: { offered: true, reason: null },
            awg: { offered: false, reason: 'vpn_probe_failed', details: 'handshake timed out' },
          },
        },
      },
      prices: { base: 100, storage: 10000, traffic: 100, min_rent_minutes: 0 },
      system: {},
      location: {},
    }
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse([node]))
    const client = makeClient(mockFetch)

    const [out] = await client.hosting.nodes()
    const vpn = out?.services?.vpn
    expect(vpn?.offered).toBe(true)
    expect(vpn?.protocols?.wg?.offered).toBe(true)
    expect(vpn?.protocols?.awg).toEqual({
      offered: false,
      reason: 'vpn_probe_failed',
      details: 'handshake timed out',
    })
  })
})

describe('hosting.get', () => {
  it('GETs one node by its number with the key', async () => {
    const [node] = loadFixture<HostingNode[]>('hosting_nodes.json')
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse(node))
    const client = makeClient(mockFetch)

    const out = await client.hosting.get('7kq4 m2xd 4')
    expect(sentRequest(mockFetch).method).toBe('GET')
    expect(sentRequest(mockFetch).url).toMatch(/\/hosting\/nodes\/7kq4%20m2xd%204$/)
    expect(sentRequest(mockFetch).headers.get('Authorization')).toBe('Bearer octa_ak_test')
    expect(out.number).toBe(node?.number)
  })

  it('throws OctaNotFoundError for a node that is not online on the account', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(makeErrorResponse({ message: 'Node not found' }, 404))
      .mockResolvedValueOnce(makeErrorResponse({ message: 'Invalid node number' }, 400))
    const client = makeClient(mockFetch)

    await expect(client.hosting.get('7KQ4-M2XD-4')).rejects.toBeInstanceOf(OctaNotFoundError)
    await expect(client.hosting.get('7KQ4-M2XD-5')).rejects.toBeInstanceOf(OctaValidationError)
  })
})

describe('hosting.setMaintenance', () => {
  it('PUTs to turn maintenance on and DELETEs to turn it off, accepting 204', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
    const client = makeClient(mockFetch)

    await expect(client.hosting.setMaintenance('7KQ4-M2XD-4', true)).resolves.toBeUndefined()
    await expect(client.hosting.setMaintenance('7KQ4-M2XD-4', false)).resolves.toBeUndefined()
    expect(sentRequest(mockFetch, 0).method).toBe('PUT')
    expect(sentRequest(mockFetch, 1).method).toBe('DELETE')
    expect(sentRequest(mockFetch, 0).url).toMatch(/\/hosting\/nodes\/7KQ4-M2XD-4\/maintenance$/)
    expect(sentBody(mockFetch, 0)).toBeUndefined()
  })

  it('is retried on a transient error: repeating it changes nothing', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(
        makeErrorResponse({ message: 'Service is temporarily unavailable' }, 503),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
    const client = makeClient(mockFetch, { retries: 1 })

    await client.hosting.setMaintenance('7KQ4-M2XD-4', true)
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('throws OctaNotFoundError for a node that is not on the account', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(makeErrorResponse({ message: 'Node not found' }, 404))
    const client = makeClient(mockFetch)

    await expect(client.hosting.setMaintenance('7KQ4-M2XD-4', true)).rejects.toBeInstanceOf(
      OctaNotFoundError,
    )
  })
})
