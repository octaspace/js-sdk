import { describe, expect, it, vi } from 'vitest'
import {
  OctaApiError,
  OctaAuthenticationError,
  OctaConflictError,
  OctaError,
  OctaNetworkError,
  OctaNotFoundError,
  OctaPermissionError,
  OctaRateLimitError,
  OctaServerError,
  OctaServiceUnavailableError,
  OctaTimeoutError,
  OctaValidationError,
} from '../../src/errors/index.js'
import { makeClient, makeErrorResponse } from './helpers.js'

describe('Error hierarchy', () => {
  it('OctaError is base', () => {
    const err = new OctaError('test')
    expect(err).toBeInstanceOf(Error)
    expect(err).toBeInstanceOf(OctaError)
    expect(err.name).toBe('OctaError')
  })

  it('OctaNetworkError extends OctaError', () => {
    const err = new OctaNetworkError('network')
    expect(err).toBeInstanceOf(OctaError)
    expect(err).toBeInstanceOf(OctaNetworkError)
  })

  it('OctaTimeoutError extends OctaNetworkError', () => {
    const err = new OctaTimeoutError('timeout')
    expect(err).toBeInstanceOf(OctaNetworkError)
    expect(err).toBeInstanceOf(OctaTimeoutError)
  })

  it('OctaServiceUnavailableError extends OctaServerError', () => {
    const err = new OctaServiceUnavailableError('unavailable', 503)
    expect(err).toBeInstanceOf(OctaServerError)
    expect(err).toBeInstanceOf(OctaApiError)
    expect(err.name).toBe('OctaServiceUnavailableError')
  })

  it('OctaApiError keeps only the details it was given', () => {
    const err = new OctaApiError('nope', 418, { requestId: 'req-1' })
    expect(err.status).toBe(418)
    expect(err.requestId).toBe('req-1')
    expect(err).not.toHaveProperty('retryAfter')
  })
})

describe('HTTP status → error class mapping', () => {
  const cases: Array<[number, new (...args: never[]) => unknown]> = [
    [400, OctaValidationError],
    [401, OctaAuthenticationError],
    [403, OctaPermissionError],
    [404, OctaNotFoundError],
    [409, OctaConflictError],
    [422, OctaValidationError],
    [500, OctaServerError],
    [502, OctaServerError],
    [503, OctaServiceUnavailableError],
    [418, OctaApiError],
  ]

  for (const [status, ErrorClass] of cases) {
    it(`maps ${status} → ${ErrorClass.name}`, async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce(makeErrorResponse({ message: 'error' }, status))
      const client = makeClient(mockFetch)

      const err = await client.accounts.balance().catch((e: unknown) => e)
      expect(err).toBeInstanceOf(ErrorClass)
      expect((err as OctaApiError).status).toBe(status)
      expect((err as OctaApiError).message).toBe('error')
    })
  }

  it('maps 429 → OctaRateLimitError with retryAfter and rateLimit', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({ message: 'Session was restarted too recently, retry in 288 seconds' }),
        {
          status: 429,
          headers: {
            'Retry-After': '288',
            'RateLimit-Limit': '10',
            'RateLimit-Remaining': '6',
            'Content-Type': 'application/json',
          },
        },
      ),
    )
    const client = makeClient(mockFetch)

    const err = (await client.accounts.balance().catch((e: unknown) => e)) as OctaRateLimitError
    expect(err).toBeInstanceOf(OctaRateLimitError)
    expect(err.retryAfter).toBe(288)
    expect(err.rateLimit).toEqual({ limit: 10, remaining: 6 })
    expect(err.message).toBe('Session was restarted too recently, retry in 288 seconds')
  })

  it('falls back to a plain-text body, truncated', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(new Response('x'.repeat(2000), { status: 502 }))
    const client = makeClient(mockFetch)

    const err = (await client.accounts.balance().catch((e: unknown) => e)) as OctaServerError
    expect(err.message.length).toBeLessThanOrEqual(513)
  })

  it('uses a generic message when the body is empty', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(new Response(null, { status: 500 }))
    const client = makeClient(mockFetch)

    await expect(client.accounts.balance()).rejects.toThrow('Request failed with status 500')
  })

  it('hints at octa_ak_ keys when a legacy token is refused', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(makeErrorResponse({ message: 'Invalid bearer token' }, 401))
    const client = makeClient(mockFetch, { apiKey: 'a'.repeat(64) })

    await expect(client.accounts.balance()).rejects.toThrow(/octa_ak_/)
  })

  it('does not add the hint for an octa_ak_ key', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(makeErrorResponse({ message: 'Invalid bearer token' }, 401))
    const client = makeClient(mockFetch, { apiKey: 'octa_ak_revoked' })

    const err = (await client.accounts.balance().catch((e: unknown) => e)) as OctaApiError
    expect(err.message).toBe('Invalid bearer token')
  })
})
