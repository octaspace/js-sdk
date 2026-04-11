import { describe, expect, it, vi } from 'vitest'
import {
  OctaAuthenticationError,
  OctaError,
  OctaNetworkError,
  OctaNotFoundError,
  OctaPermissionError,
  OctaRateLimitError,
  OctaServerError,
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
})

describe('HTTP status → error class mapping', () => {
  const cases: Array<[number, new (...args: never[]) => unknown]> = [
    [401, OctaAuthenticationError],
    [403, OctaPermissionError],
    [404, OctaNotFoundError],
    [422, OctaValidationError],
    [500, OctaServerError],
    [503, OctaServerError],
  ]

  for (const [status, ErrorClass] of cases) {
    it(`maps ${status} → ${ErrorClass.name}`, async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce(makeErrorResponse({ message: 'error' }, status))
      const client = makeClient(mockFetch)

      await expect(client.accounts.get()).rejects.toBeInstanceOf(ErrorClass)
    })
  }

  it('maps 429 → OctaRateLimitError with retryAfter', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'rate limited' }), {
        status: 429,
        headers: { 'Retry-After': '30', 'Content-Type': 'application/json' },
      }),
    )
    const client = makeClient(mockFetch)

    const err = await client.accounts.get().catch((e: unknown) => e)
    expect(err).toBeInstanceOf(OctaRateLimitError)
    expect((err as OctaRateLimitError).retryAfter).toBe(30)
  })
})
