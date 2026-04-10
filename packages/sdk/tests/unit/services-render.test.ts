import { describe, expect, it, vi } from 'vitest'
import { makeClient, makeResponse } from './helpers.js'

describe('RenderService', () => {
  it('available() returns render node list', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse([{ node_id: 3 }]))
    const client = makeClient(mockFetch)
    const nodes = await client.services.render.available()

    expect(nodes[0]?.node_id).toBe(3)
    const [url] = mockFetch.mock.calls[0] as [string]
    expect(url).toContain('/services/render')
  })

  it('start() sends POST and returns uuid', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse({ uuid: 'sess-render-1' }))
    const client = makeClient(mockFetch)
    const result = await client.services.render.start({
      node_id: 3,
      disk_size: 200,
      'multi-gpu-worker': true,
    })

    expect(result.uuid).toBe('sess-render-1')
    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(init.method).toBe('POST')
    expect(init.body).toContain('multi-gpu-worker')
  })
})
