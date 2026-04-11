export type MockScenario =
  | 'real'
  | '401'
  | '403'
  | '404'
  | '429'
  | '500'
  | 'timeout'
  | 'network-error'
  | 'slow'

export const MOCK_SCENARIOS: { value: MockScenario; label: string; description: string }[] = [
  { value: 'real', label: 'Real API', description: 'Use the actual OctaSpace API' },
  { value: '401', label: '401 Unauthorized', description: 'Simulates invalid or missing API key' },
  { value: '403', label: '403 Forbidden', description: 'Simulates insufficient permissions' },
  { value: '404', label: '404 Not Found', description: 'Simulates a missing resource' },
  { value: '429', label: '429 Rate Limited', description: 'Simulates rate limiting with Retry-After: 60' },
  { value: '500', label: '500 Server Error', description: 'Simulates an internal server error' },
  { value: 'slow', label: 'Slow (3s)', description: 'Adds a 3-second delay before responding' },
  { value: 'timeout', label: 'Timeout', description: "Never responds — triggers the SDK's built-in timeout" },
  { value: 'network-error', label: 'Network Error', description: 'Simulates a connection failure (TypeError: Failed to fetch)' },
]

/**
 * Returns a fetch implementation for the given mock scenario.
 * For 'real', returns globalThis.fetch unchanged.
 * For all others, intercepts requests and returns/throws the simulated response.
 *
 * The 'timeout' scenario intentionally never resolves — it relies on the SDK's
 * built-in AbortController + timeoutMs to fire OctaTimeoutError.
 */
export function createMockFetch(scenario: MockScenario): typeof globalThis.fetch {
  if (scenario === 'real') return globalThis.fetch.bind(globalThis)

  return async (_input, init) => {
    const signal = (init as RequestInit | undefined)?.signal

    if (scenario === 'network-error') {
      throw new TypeError('Failed to fetch')
    }

    if (scenario === 'timeout') {
      // Await forever — the SDK's timeout AbortController will fire and reject this.
      await new Promise<never>((_, reject) => {
        if (signal) {
          if (signal.aborted) {
            reject(signal.reason ?? new DOMException('Aborted', 'AbortError'))
            return
          }
          signal.addEventListener('abort', () =>
            reject(signal.reason ?? new DOMException('Aborted', 'AbortError')),
          )
        }
        // If no signal (shouldn't happen with SDK), just never resolve.
      })
      // Unreachable — TypeScript needs this for exhaustiveness.
      throw new Error('unreachable')
    }

    if (scenario === 'slow') {
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(resolve, 3_000)
        if (signal) {
          if (signal.aborted) {
            clearTimeout(timer)
            reject(signal.reason ?? new DOMException('Aborted', 'AbortError'))
            return
          }
          signal.addEventListener('abort', () => {
            clearTimeout(timer)
            reject(signal.reason ?? new DOMException('Aborted', 'AbortError'))
          })
        }
      })
    }

    const statusMap: Record<string, number> = {
      '401': 401,
      '403': 403,
      '404': 404,
      '429': 429,
      '500': 500,
    }
    const status = statusMap[scenario] ?? 200
    const headers: Record<string, string> = { 'content-type': 'application/json' }
    if (scenario === '429') headers['retry-after'] = '60'

    return new Response(JSON.stringify({ error: `Mocked ${status}`, scenario }), {
      status,
      headers,
    })
  }
}
