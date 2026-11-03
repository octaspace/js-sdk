import { describe, expect, it, vi } from 'vitest'
import { OctaServiceUnavailableError } from '../../src/errors/index.js'
import type { RenderMachine } from '../../src/types/index.js'
import {
  loadFixture,
  makeClient,
  makeErrorResponse,
  makeResponse,
  sentBody,
  sentRequest,
} from './helpers.js'

describe('render.list', () => {
  it('GETs /services/render and decodes the live listing', async () => {
    const fixture = loadFixture<RenderMachine[]>('services_render.json')
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse(fixture))
    const client = makeClient(mockFetch, { apiKey: null })

    const nodes = await client.render.list()
    expect(sentRequest(mockFetch).url).toMatch(/\/services\/render$/)
    expect(sentRequest(mockFetch).headers.has('Authorization')).toBe(false)
    expect(nodes).toHaveLength(fixture.length)
    expect(nodes[0]?.node_number).toMatch(/^[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]$/)
    expect(typeof nodes[0]?.blender_score).toBe('number')
  })
})

describe('render.start', () => {
  it('POSTs only the node number', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse({ uuid: 'r-1' }, 201))
    const client = makeClient(mockFetch)

    const params = { node_number: '7R2S-S05E-S', disk_size: 10 }
    await expect(client.render.start(params)).resolves.toEqual({ uuid: 'r-1' })
    expect(sentBody(mockFetch)).toEqual({ node_number: '7R2S-S05E-S' })
  })

  it('throws OctaServiceUnavailableError when render is unavailable', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(
        makeErrorResponse({ message: 'Service is temporarily unavailable' }, 503),
      )
    const client = makeClient(mockFetch, { retries: 2 })

    await expect(client.render.start({ node_number: 'N' })).rejects.toBeInstanceOf(
      OctaServiceUnavailableError,
    )
    expect(mockFetch).toHaveBeenCalledOnce()
  })
})

describe('render.startBatch', () => {
  it('reports per-item failures, including an unavailable service', async () => {
    const results = [
      { id: 0, status: 1, reason: 'Service is temporarily unavailable' },
      { id: 'x', status: 1, reason: 'node_number must be a node number, e.g. 7KQ4-M2XD-4' },
    ]
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse(results))
    const client = makeClient(mockFetch)

    const out = await client.render.startBatch([
      { node_number: '7R2S-S05E-S' },
      { id: 'x', node_number: 'ZZZZ-ZZZZ-Z' },
    ])
    expect(out).toEqual(results)
    expect(sentBody(mockFetch)).toEqual([
      { id: 0, node_number: '7R2S-S05E-S' },
      { id: 'x', node_number: 'ZZZZ-ZZZZ-Z' },
    ])
  })
})
