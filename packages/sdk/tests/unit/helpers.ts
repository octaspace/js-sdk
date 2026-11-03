import { readFileSync } from 'node:fs'
import { OctaClient } from '../../src/client.js'
import type { OctaClientOptions } from '../../src/config.js'

export function makeResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  const init: ResponseInit = {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  }
  return new Response(JSON.stringify(body), init)
}

export function makeErrorResponse(
  body: { message: string; code?: string },
  status: number,
  headers: Record<string, string> = {},
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  })
}

export function makeClient(
  mockFetch: typeof globalThis.fetch,
  overrides: Omit<Partial<OctaClientOptions>, 'apiKey'> & { apiKey?: string | null } = {},
) {
  const { apiKey, ...rest } = overrides

  return new OctaClient({
    fetch: mockFetch,
    retries: 0, // disable retries in tests by default
    ...(apiKey !== null ? { apiKey: apiKey ?? 'octa_ak_test' } : {}),
    ...rest,
  })
}

/** Reads a recorded next API response from tests/fixtures/next. */
export function loadFixture<T = unknown>(name: string): T {
  const url = new URL(`../fixtures/next/${name}`, import.meta.url)
  return JSON.parse(readFileSync(url, 'utf-8')) as T
}

/** The parsed JSON body sent with the given fetch call. */
export function sentBody(mockFetch: { mock: { calls: unknown[][] } }, call = 0): unknown {
  const init = mockFetch.mock.calls[call]?.[1] as RequestInit | undefined
  return typeof init?.body === 'string' ? JSON.parse(init.body) : undefined
}

/** `[method, url]` of the given fetch call. */
export function sentRequest(mockFetch: { mock: { calls: unknown[][] } }, call = 0) {
  const [url, init] = mockFetch.mock.calls[call] as [string, RequestInit]
  return { method: init.method, url, headers: init.headers as Headers }
}
