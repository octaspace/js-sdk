import { OctaClient } from '@octaspace/sdk'
import type { ResponseContext } from '@octaspace/sdk'
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react'
import { type MockScenario, createMockFetch } from '../mocks/fetch'

// ─── Request log ─────────────────────────────────────────────────────────────

export interface LogEntry {
  id: string
  method: string
  url: string
  attempt: number
  status: number
  durationMs: number
  timestamp: number
  /** Present for transport-level failures (network error, timeout, abort) */
  errorMessage?: string
}

type LogAction = { type: 'add'; entry: LogEntry } | { type: 'clear' }

function logReducer(state: LogEntry[], action: LogAction): LogEntry[] {
  switch (action.type) {
    case 'clear':
      return []
    case 'add':
      // Keep the 200 most recent entries, newest first
      return [action.entry, ...state].slice(0, 200)
  }
}

// ─── Client config ────────────────────────────────────────────────────────────

export interface ClientConfig {
  apiKey: string
  baseUrl: string
  timeoutMs: number
  retries: number
  mockScenario: MockScenario
}

function getDefaultConfig(): ClientConfig {
  return {
    apiKey: import.meta.env.VITE_OCTA_API_KEY ?? '',
    baseUrl: 'https://api.octa.computer',
    timeoutMs: 30_000,
    retries: 2,
    mockScenario: 'real',
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface ClientContextValue {
  config: ClientConfig
  setConfig: (updates: Partial<ClientConfig>) => void
  client: OctaClient
  log: LogEntry[]
  clearLog: () => void
}

const ClientContext = createContext<ClientContextValue | null>(null)

export function ClientProvider({ children }: { children: ReactNode }) {
  const [config, setConfigState] = useState<ClientConfig>(getDefaultConfig)
  const [log, dispatch] = useReducer(logReducer, [])

  const setConfig = useCallback((updates: Partial<ClientConfig>) => {
    setConfigState((prev) => ({ ...prev, ...updates }))
  }, [])

  const clearLog = useCallback(() => dispatch({ type: 'clear' }), [])

  // Use a ref so the onResponse closure never stales — avoids adding dispatch to useMemo deps
  const dispatchRef = useRef(dispatch)
  dispatchRef.current = dispatch

  const client = useMemo(() => {
      const baseFetch = createMockFetch(config.mockScenario)

      // Wrap fetch to log transport-level failures (network error, timeout, abort)
      // that never reach the SDK's onResponse hook.
      const instrumentedFetch: typeof globalThis.fetch = async (input, init) => {
        const startMs = Date.now()
        try {
          return await baseFetch(input, init)
        } catch (err) {
          const durationMs = Date.now() - startMs
          const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url
          dispatchRef.current({
            type: 'add',
            entry: {
              id: crypto.randomUUID(),
              method: (init as RequestInit | undefined)?.method ?? 'GET',
              url,
              attempt: 0,
              status: 0,
              durationMs: Math.round(durationMs),
              timestamp: Date.now(),
              errorMessage: err instanceof Error ? err.message : String(err),
            },
          })
          throw err
        }
      }

      return new OctaClient({
        // exactOptionalPropertyTypes: pass apiKey only when non-empty, never explicitly undefined
        ...(config.apiKey ? { apiKey: config.apiKey } : {}),
        baseUrl: config.baseUrl,
        timeoutMs: config.timeoutMs,
        retries: config.retries,
        fetch: instrumentedFetch,
        onResponse: (ctx: ResponseContext) => {
          dispatchRef.current({
            type: 'add',
            entry: {
              id: crypto.randomUUID(),
              method: ctx.request.method,
              url: ctx.request.url,
              attempt: ctx.request.attempt,
              status: ctx.status,
              durationMs: Math.round(ctx.durationMs),
              timestamp: Date.now(),
            },
          })
        },
      })
    },
    // New OctaClient only when connection config changes, not on every log update
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config.apiKey, config.baseUrl, config.timeoutMs, config.retries, config.mockScenario],
  )

  const value = useMemo(
    () => ({ config, setConfig, client, log, clearLog }),
    [config, setConfig, client, log, clearLog],
  )

  return <ClientContext.Provider value={value}>{children}</ClientContext.Provider>
}

export function useClientContext(): ClientContextValue {
  const ctx = useContext(ClientContext)
  if (!ctx) throw new Error('useClientContext must be used within ClientProvider')
  return ctx
}
