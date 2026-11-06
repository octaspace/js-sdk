import { describe, expect, it, vi } from 'vitest'
import { OctaClient } from '../../src/client.js'
import { DEFAULT_BASE_URL } from '../../src/config.js'
import {
  OctaApiError,
  OctaAuthenticationError,
  OctaNetworkError,
  OctaServerError,
  OctaTimeoutError,
} from '../../src/errors/index.js'
import { normalizeApiKey, parseRateLimit, parseRetryAfter } from '../../src/transport/http.js'
import { makeClient, makeErrorResponse, makeResponse } from './helpers.js'

function headersOf(mockFetch: ReturnType<typeof vi.fn>, call = 0): Headers {
  const [, init] = mockFetch.mock.calls[call] as [string, RequestInit]
  return init.headers as Headers
}

function urlOf(mockFetch: ReturnType<typeof vi.fn>, call = 0): string {
  return (mockFetch.mock.calls[call] as [string, RequestInit])[0]
}

describe('HttpTransport', () => {
  it('sends the API key as a Bearer token', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse({ balance: 100 }))
    const client = makeClient(mockFetch, { apiKey: 'octa_ak_secret' })
    await client.accounts.balance()

    expect(headersOf(mockFetch).get('Authorization')).toBe('Bearer octa_ak_secret')
  })

  it('does not double the Bearer prefix of a pasted header value', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse({ balance: 100 }))
    const client = makeClient(mockFetch, { apiKey: '  Bearer octa_ak_secret ' })
    await client.accounts.balance()

    expect(headersOf(mockFetch).get('Authorization')).toBe('Bearer octa_ak_secret')
  })

  it('never sends the key to a public endpoint', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse({}))
    const client = makeClient(mockFetch, { apiKey: 'octa_ak_secret' })
    await client.network.info()

    expect(headersOf(mockFetch).has('Authorization')).toBe(false)
  })

  it('includes User-Agent header', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse({ balance: 0 }))
    const client = makeClient(mockFetch)
    await client.accounts.balance()

    expect(headersOf(mockFetch).get('User-Agent')).toMatch(/@octaspace\/sdk/)
  })

  it('throws before request when apiKey is missing for authenticated endpoint', async () => {
    const mockFetch = vi.fn()
    const client = makeClient(mockFetch, { apiKey: null })

    await expect(client.accounts.balance()).rejects.toBeInstanceOf(OctaAuthenticationError)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('treats a blank apiKey as missing', async () => {
    const mockFetch = vi.fn()
    const client = makeClient(mockFetch, { apiKey: '   ' })

    await expect(client.accounts.balance()).rejects.toBeInstanceOf(OctaAuthenticationError)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('defaults to the next API test stand', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse({}))
    const client = new OctaClient({ fetch: mockFetch, retries: 0 })
    await client.network.info()

    expect(DEFAULT_BASE_URL).toBe('https://api-dev.octa.space')
    expect(urlOf(mockFetch)).toBe('https://api-dev.octa.space/network')
  })

  it('builds correct URL with query params', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse([]))
    const client = makeClient(mockFetch)
    await client.sessions.logs('u-1', { tail: 50 })

    expect(urlOf(mockFetch)).toMatch(/\/services\/u-1\/logs\?tail=50$/)
  })

  it('skips undefined query params', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse([]))
    const client = makeClient(mockFetch)
    await client.sessions.logs('u-1')

    expect(urlOf(mockFetch)).toMatch(/\/services\/u-1\/logs$/)
  })

  it('uses custom baseUrl and strips a trailing slash', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse({ balance: 0 }))
    const client = makeClient(mockFetch, { baseUrl: 'https://staging.example.com/' })
    await client.accounts.balance()

    expect(urlOf(mockFetch)).toBe('https://staging.example.com/accounts/balance')
  })

  it('rejects an empty base URL list', () => {
    expect(() => makeClient(vi.fn(), { baseUrls: [' '] })).toThrow(TypeError)
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

  it('throws OctaTimeoutError on TimeoutError from AbortSignal.timeout', async () => {
    const mockFetch = vi.fn().mockRejectedValueOnce(new DOMException('timeout', 'TimeoutError'))
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
    await client.compute.start({ node_number: 'M95S-WZG8-7', image: 'alpine' })

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(headersOf(mockFetch).get('Content-Type')).toBe('application/json')
    expect(init.body).toBe('{"node_number":"M95S-WZG8-7","image":"alpine"}')
  })

  it('accepts 202 and 204 responses without a body', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response('', { status: 202 }))
    const client = makeClient(mockFetch)

    await expect(client.sessions.stop('uuid-1')).resolves.toEqual({ uuid: 'uuid-1' })
    await expect(client.sessions.stop('uuid-1')).resolves.toEqual({ uuid: 'uuid-1' })
  })
})

describe('failover', () => {
  it('moves a GET to the next base URL on a network error', async () => {
    const mockFetch = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('connect ECONNREFUSED'))
      .mockResolvedValueOnce(makeResponse({}))
    const client = makeClient(mockFetch, {
      baseUrls: ['https://a.example.com', 'https://b.example.com'],
    })

    await client.network.info()
    expect(urlOf(mockFetch, 0)).toBe('https://a.example.com/network')
    expect(urlOf(mockFetch, 1)).toBe('https://b.example.com/network')
  })

  it('does not fail over on an HTTP error', async () => {
    const mockFetch = vi.fn().mockResolvedValue(makeErrorResponse({ message: 'boom' }, 500))
    const client = makeClient(mockFetch, {
      baseUrls: ['https://a.example.com', 'https://b.example.com'],
    })

    await expect(client.network.info()).rejects.toBeInstanceOf(OctaServerError)
    expect(mockFetch).toHaveBeenCalledOnce()
  })

  it('sends a POST to the first base URL only', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new TypeError('connect ECONNREFUSED'))
    const client = makeClient(mockFetch, {
      baseUrls: ['https://a.example.com', 'https://b.example.com'],
    })

    await expect(
      client.compute.start({ node_number: 'M95S-WZG8-7', image: 'alpine' }),
    ).rejects.toBeInstanceOf(OctaNetworkError)
    expect(mockFetch).toHaveBeenCalledOnce()
    expect(urlOf(mockFetch)).toMatch(/^https:\/\/a\.example\.com/)
  })
})

describe('rate limit headers', () => {
  it('exposes the last RateLimit-* state on the client', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(
      makeResponse({}, 200, {
        'RateLimit-Limit': '300',
        'RateLimit-Remaining': '299',
        'RateLimit-Reset': '42',
      }),
    )
    const client = makeClient(mockFetch)

    expect(client.rateLimit).toBeUndefined()
    await client.network.info()
    expect(client.rateLimit).toEqual({ limit: 300, remaining: 299, reset: 42 })
  })

  it('keeps the previous state when a response has no RateLimit-* headers', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(makeResponse({}, 200, { 'RateLimit-Limit': '60' }))
      .mockResolvedValueOnce(makeResponse({}))
    const client = makeClient(mockFetch)

    await client.network.info()
    await client.network.info()
    expect(client.rateLimit).toEqual({ limit: 60 })
  })
})

describe('header helpers', () => {
  it('normalizeApiKey', () => {
    expect(normalizeApiKey(undefined)).toBeUndefined()
    expect(normalizeApiKey('  ')).toBeUndefined()
    expect(normalizeApiKey('bearer octa_ak_x')).toBe('octa_ak_x')
    expect(normalizeApiKey('octa_ak_x')).toBe('octa_ak_x')
  })

  it('parseRetryAfter reads seconds and HTTP dates', () => {
    expect(parseRetryAfter(null)).toBeUndefined()
    expect(parseRetryAfter('288')).toBe(288)
    expect(parseRetryAfter('soon')).toBeUndefined()
    expect(parseRetryAfter('1.5')).toBe(2)
    expect(parseRetryAfter('2.0')).toBe(2)
    expect(parseRetryAfter('1.5s')).toBeUndefined()
    expect(parseRetryAfter('2026-11-03')).toBeUndefined()
    const inTenSeconds = new Date(Date.now() + 10_000).toUTCString()
    expect(parseRetryAfter(inTenSeconds)).toBeGreaterThanOrEqual(9)
    expect(parseRetryAfter(inTenSeconds)).toBeLessThanOrEqual(11)
    expect(parseRetryAfter(new Date(0).toUTCString())).toBe(0)
  })

  it('parseRateLimit ignores malformed values', () => {
    expect(parseRateLimit(new Headers())).toBeUndefined()
    expect(parseRateLimit(new Headers({ 'RateLimit-Limit': 'many' }))).toBeUndefined()
    expect(parseRateLimit(new Headers({ 'RateLimit-Remaining': '0' }))).toEqual({ remaining: 0 })
  })
})

describe('response bodies', () => {
  it('maps a 2xx body that is not JSON to OctaApiError', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(new Response('<html>captive portal</html>', { status: 200 }))
    const client = makeClient(mockFetch)

    const err = (await client.network.info().catch((e: unknown) => e)) as OctaApiError
    expect(err).toBeInstanceOf(OctaApiError)
    expect(err.status).toBe(200)
    expect(err.message).toMatch(/not valid JSON/)
    expect(err.body).toBe('<html>captive portal</html>')
  })

  it('maps a failure while reading the body to OctaNetworkError and retries the GET', async () => {
    const broken = new Response('{}', { status: 200 })
    vi.spyOn(broken, 'text').mockRejectedValueOnce(new TypeError('terminated'))
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(broken)
      .mockResolvedValueOnce(makeResponse({ at: 1 }))
    const client = makeClient(mockFetch, { retries: 1 })

    await expect(client.network.info()).resolves.toEqual({ at: 1 })
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('maps a timeout while reading the body to OctaTimeoutError', async () => {
    const slow = new Response('{}', { status: 200 })
    vi.spyOn(slow, 'text').mockRejectedValueOnce(new DOMException('timeout', 'TimeoutError'))
    const client = makeClient(vi.fn().mockResolvedValueOnce(slow))

    await expect(client.network.info()).rejects.toBeInstanceOf(OctaTimeoutError)
  })
})
