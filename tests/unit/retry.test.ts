import { describe, expect, it, vi } from 'vitest'
import { OctaNetworkError, OctaServerError } from '../../src/errors/index.js'
import { makeClient, makeErrorResponse, makeResponse } from './helpers.js'

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

  it('retries GET on 500 and succeeds', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(makeErrorResponse({ message: 'server error' }, 500))
      .mockResolvedValueOnce(makeResponse({ balance: 10 }))

    const client = makeClient(mockFetch, { retries: 1 })
    const result = await client.accounts.balance()
    expect(result.balance).toBe(10)
  })

  it('throws after exhausting all retries', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new TypeError('Network fail'))

    const client = makeClient(mockFetch, { retries: 2 })
    await expect(client.accounts.balance()).rejects.toBeInstanceOf(OctaNetworkError)
    expect(mockFetch).toHaveBeenCalledTimes(3) // 1 initial + 2 retries
  })

  it('does NOT retry POST requests', async () => {
    const mockFetch = vi.fn().mockResolvedValue(makeErrorResponse({ message: 'server error' }, 500))

    const client = makeClient(mockFetch, { retries: 2 })
    await expect(
      client.services.mr.start({ node_id: 1, disk_size: 50, image: 'ubuntu:24.04' }),
    ).rejects.toBeInstanceOf(OctaServerError)
    expect(mockFetch).toHaveBeenCalledTimes(1) // no retries for POST
  })

  it('does NOT retry on 404', async () => {
    const mockFetch = vi.fn().mockResolvedValue(makeErrorResponse({ message: 'not found' }, 404))

    const client = makeClient(mockFetch, { retries: 2 })
    await expect(client.accounts.balance()).rejects.toThrow('not found')
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })
})
