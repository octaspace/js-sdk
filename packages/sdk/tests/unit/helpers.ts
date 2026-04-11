import { OctaClient } from '../../src/client.js'
import type { OctaClientOptions } from '../../src/config.js'

export function makeResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  const init: ResponseInit = {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  }
  return new Response(JSON.stringify(body), init)
}

export function makeBlobResponse(blob: Blob, status = 200) {
  return new Response(blob, { status })
}

export function makeErrorResponse(body: { message: string; code?: string }, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
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
    ...(apiKey !== null ? { apiKey: apiKey ?? 'test_api_key' } : {}),
    ...rest,
  })
}
