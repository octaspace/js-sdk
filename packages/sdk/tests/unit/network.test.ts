import { describe, expect, it, vi } from 'vitest'
import { OctaServiceUnavailableError } from '../../src/errors/index.js'
import type { NetworkInfo } from '../../src/types/index.js'
import { loadFixture, makeClient, makeErrorResponse, makeResponse, sentRequest } from './helpers.js'

describe('network.info', () => {
  it('GETs /network anonymously and decodes the live snapshot', async () => {
    const fixture = loadFixture<NetworkInfo>('network.json')
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse(fixture))
    const client = makeClient(mockFetch, { apiKey: null })

    const net = await client.network.info()
    expect(sentRequest(mockFetch).url).toMatch(/\/network$/)
    expect(sentRequest(mockFetch).headers.has('Authorization')).toBe(false)
    expect(typeof net.at).toBe('number')
    expect(typeof net.nodes.online).toBe('number')
    expect(typeof net.power.cpu_cores).toBe('number')
    expect(Array.isArray(net.render.frames_by_week)).toBe(true)
  })

  it('maps 503 to OctaServiceUnavailableError', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValue(makeErrorResponse({ message: 'Network information is unavailable' }, 503))
    const client = makeClient(mockFetch)

    await expect(client.network.info()).rejects.toBeInstanceOf(OctaServiceUnavailableError)
  })
})
