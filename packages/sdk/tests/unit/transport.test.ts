import { describe, expect, it, vi } from 'vitest'
import {
  OctaAuthenticationError,
  OctaNetworkError,
  OctaTimeoutError,
} from '../../src/errors/index.js'
import { makeClient, makeResponse } from './helpers.js'

describe('HttpTransport', () => {
  it('sends Authorization header with api key', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse({ balance: 100 }))
    const client = makeClient(mockFetch, { apiKey: 'my_secret_key' })
    await client.accounts.balance()

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit]
    const headers = init.headers as Headers
    expect(headers.get('Authorization')).toBe('my_secret_key')
  })

  it('includes User-Agent header', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse({ balance: 0 }))
    const client = makeClient(mockFetch)
    await client.accounts.balance()

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit]
    const headers = init.headers as Headers
    expect(headers.get('User-Agent')).toMatch(/@octaspace\/sdk/)
  })

  it('throws before request when apiKey is missing for authenticated endpoint', async () => {
    const mockFetch = vi.fn()
    const client = makeClient(mockFetch, { apiKey: null })

    await expect(client.accounts.balance()).rejects.toBeInstanceOf(OctaAuthenticationError)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('builds correct URL with query params', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse([]))
    const client = makeClient(mockFetch)
    await client.sessions.list({ recent: true })

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/sessions')
    expect(url).toContain('recent=true')
  })

  it('skips undefined query params', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse([]))
    const client = makeClient(mockFetch)
    await client.sessions.list({})

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(url).not.toContain('recent')
  })

  it('uses custom baseUrl', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse({ balance: 0 }))
    const client = makeClient(mockFetch, { baseUrl: 'https://staging.example.com' })
    await client.accounts.balance()

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(url).toMatch(/^https:\/\/staging\.example\.com/)
  })

  it('throws OctaNetworkError on fetch failure', async () => {
    const mockFetch = vi.fn().mockRejectedValueOnce(new TypeError('Failed to fetch'))
    const client = makeClient(mockFetch)
    await expect(client.accounts.balance()).rejects.toBeInstanceOf(OctaNetworkError)
  })

  it('throws OctaTimeoutError on AbortError', async () => {
    const abortErr = new DOMException('aborted', 'AbortError')
    const mockFetch = vi.fn().mockRejectedValueOnce(abortErr)
    const client = makeClient(mockFetch)
    await expect(client.accounts.balance()).rejects.toBeInstanceOf(OctaTimeoutError)
  })

  it('calls onRequest and onResponse hooks', async () => {
    const onRequest = vi.fn()
    const onResponse = vi.fn()
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse({ balance: 0 }))
    const client = makeClient(mockFetch, { onRequest, onResponse })

    await client.accounts.balance()
    expect(onRequest).toHaveBeenCalledOnce()
    expect(onResponse).toHaveBeenCalledOnce()
  })

  it('sends JSON body with Content-Type header', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse([{ uuid: 'sess_1' }]))
    const client = makeClient(mockFetch)
    await client.services.mr.start({ node_id: 1, disk_size: 50, image: 'ubuntu:22.04' })

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit]
    const headers = init.headers as Headers
    expect(headers.get('Content-Type')).toBe('application/json')
    expect(init.body).toContain('"node_id":1')
  })
})
