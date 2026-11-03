import { describe, expect, it, vi } from 'vitest'
import {
  OctaNetworkError,
  OctaRateLimitError,
  OctaServerError,
  OctaServiceUnavailableError,
} from '../../src/errors/index.js'
import { makeClient, makeErrorResponse, makeResponse } from './helpers.js'

function rateLimited(retryAfter: string) {
  return makeErrorResponse({ message: 'Too many requests' }, 429, { 'Retry-After': retryAfter })
}

describe('Retry behavior', () => {
  it('retries GET on network error and succeeds', async () => {
    const mockFetch = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Network fail'))
      .mockResolvedValueOnce(makeResponse({ balance: 42 }))

    const client = makeClient(mockFetch, { retries: 1 })
    const result = await client.accounts.balance()
    expect(result.balance).toBe(42)
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  for (const status of [502, 503, 504]) {
    it(`retries GET on ${status} and succeeds`, async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce(makeErrorResponse({ message: 'unavailable' }, status))
        .mockResolvedValueOnce(makeResponse({ balance: 10 }))

      const client = makeClient(mockFetch, { retries: 1 })
      const result = await client.accounts.balance()
      expect(result.balance).toBe(10)
    })
  }

  it('does NOT retry GET on 500', async () => {
    const mockFetch = vi.fn().mockResolvedValue(makeErrorResponse({ message: 'bug' }, 500))

    const client = makeClient(mockFetch, { retries: 2 })
    await expect(client.accounts.balance()).rejects.toBeInstanceOf(OctaServerError)
    expect(mockFetch).toHaveBeenCalledOnce()
  })

  it('retries GET on 429 after Retry-After', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(rateLimited('0'))
      .mockResolvedValueOnce(makeResponse({ balance: 1 }))

    const client = makeClient(mockFetch, { retries: 1 })
    await expect(client.accounts.balance()).resolves.toEqual({ balance: 1 })
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('gives up at once when Retry-After exceeds the cap', async () => {
    const mockFetch = vi.fn().mockResolvedValue(rateLimited('288'))

    const client = makeClient(mockFetch, { retries: 2 })
    const err = (await client.accounts.balance().catch((e: unknown) => e)) as OctaRateLimitError
    expect(err).toBeInstanceOf(OctaRateLimitError)
    expect(err.retryAfter).toBe(288)
    expect(mockFetch).toHaveBeenCalledOnce()
  })

  it('throws after exhausting all retries', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new TypeError('Network fail'))

    const client = makeClient(mockFetch, { retries: 2 })
    await expect(client.accounts.balance()).rejects.toBeInstanceOf(OctaNetworkError)
    expect(mockFetch).toHaveBeenCalledTimes(3) // 1 initial + 2 retries
  })

  it('does NOT retry POST requests', async () => {
    const mockFetch = vi.fn().mockResolvedValue(makeErrorResponse({ message: 'down' }, 503))

    const client = makeClient(mockFetch, { retries: 2 })
    await expect(
      client.compute.start({ node_number: 'M95S-WZG8-7', image: 'alpine' }),
    ).rejects.toBeInstanceOf(OctaServiceUnavailableError)
    expect(mockFetch).toHaveBeenCalledTimes(1) // no retries for POST
  })

  it('does NOT retry on 404', async () => {
    const mockFetch = vi.fn().mockResolvedValue(makeErrorResponse({ message: 'not found' }, 404))

    const client = makeClient(mockFetch, { retries: 2 })
    await expect(client.accounts.balance()).rejects.toThrow('not found')
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('does NOT retry a request the caller aborted', async () => {
    const controller = new AbortController()
    const mockFetch = vi.fn().mockImplementation(() => {
      controller.abort()
      return Promise.reject(new DOMException('aborted', 'AbortError'))
    })

    const client = makeClient(mockFetch, { retries: 2 })
    await expect(client.accounts.balance({ signal: controller.signal })).rejects.toThrow(
      'Request was aborted',
    )
    expect(mockFetch).toHaveBeenCalledOnce()
  })
})
