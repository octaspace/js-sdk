/**
 * Diagnostics page — manually trigger any SDK method and inspect the result.
 *
 * Mock transport is set in the sidebar. This page lets you pick a method,
 * hit "Run", and see the full response or typed error.
 *
 * This is the primary way to test error class behavior, retry logic, and
 * abort without waiting for real API side effects.
 */
import type { OctaClient } from '@octaspace/sdk'
import { useState } from 'react'
import { ErrorCard } from '../components/error-card'
import { JsonViewer } from '../components/json-viewer'
import { useClientContext } from '../store/client-context'
import { MOCK_SCENARIOS } from '../mocks/fetch'

interface SdkCall {
  id: string
  label: string
  description: string
  requiresAuth: boolean
  fn: (client: OctaClient, signal: AbortSignal) => Promise<unknown>
}

const SDK_CALLS: SdkCall[] = [
  {
    id: 'network.get',
    label: 'client.network.get()',
    description: 'GET /network — public, no auth required',
    requiresAuth: false,
    fn: (c, signal) => c.network.get({ signal }),
  },
  {
    id: 'accounts.get',
    label: 'client.accounts.get()',
    description: 'GET /accounts — requires API key',
    requiresAuth: true,
    fn: (c, signal) => c.accounts.get({ signal }),
  },
  {
    id: 'accounts.balance',
    label: 'client.accounts.balance()',
    description: 'GET /accounts/balance — requires API key',
    requiresAuth: true,
    fn: (c, signal) => c.accounts.balance({ signal }),
  },
  {
    id: 'apps.list',
    label: 'client.apps.list()',
    description: 'GET /apps — requires API key',
    requiresAuth: true,
    fn: (c, signal) => c.apps.list({ signal }),
  },
  {
    id: 'nodes.list',
    label: 'client.nodes.list()',
    description: 'GET /nodes — requires API key',
    requiresAuth: true,
    fn: (c, signal) => c.nodes.list({ signal }),
  },
  {
    id: 'sessions.list',
    label: 'client.sessions.list({})',
    description: 'GET /sessions — requires API key',
    requiresAuth: true,
    fn: (c, signal) => c.sessions.list({}, { signal }),
  },
  {
    id: 'sessions.list.recent',
    label: 'client.sessions.list({ recent: true })',
    description: 'GET /sessions?recent=true — requires API key',
    requiresAuth: true,
    fn: (c, signal) => c.sessions.list({ recent: true }, { signal }),
  },
  {
    id: 'services.mr.available',
    label: 'client.services.mr.available()',
    description: 'GET /services/mr — requires API key',
    requiresAuth: true,
    fn: (c, signal) => c.services.mr.available({ signal }),
  },
  {
    id: 'services.render.available',
    label: 'client.services.render.available()',
    description: 'GET /services/render — requires API key',
    requiresAuth: true,
    fn: (c, signal) => c.services.render.available({ signal }),
  },
  {
    id: 'services.vpn.available',
    label: 'client.services.vpn.available()',
    description: 'GET /services/vpn — requires API key',
    requiresAuth: true,
    fn: (c, signal) => c.services.vpn.available({ signal }),
  },
]

type RunState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: unknown; durationMs: number }
  | { status: 'error'; error: unknown; durationMs: number }

export function DiagnosticsPage() {
  const { client, config } = useClientContext()
  const [selectedCallId, setSelectedCallId] = useState<string>(SDK_CALLS[0]!.id)
  const [result, setResult] = useState<RunState>({ status: 'idle' })
  const [abortController, setAbortController] = useState<AbortController | null>(null)

  const selectedCall = SDK_CALLS.find((c) => c.id === selectedCallId)!
  const currentScenario = MOCK_SCENARIOS.find((s) => s.value === config.mockScenario)!

  async function handleRun() {
    const controller = new AbortController()
    setAbortController(controller)
    setResult({ status: 'loading' })

    const start = performance.now()
    try {
      const data = await selectedCall.fn(client, controller.signal)
      const durationMs = Math.round(performance.now() - start)
      setResult({ status: 'success', data, durationMs })
    } catch (err) {
      const durationMs = Math.round(performance.now() - start)
      setResult({ status: 'error', error: err, durationMs })
    } finally {
      setAbortController(null)
    }
  }

  function handleAbort() {
    abortController?.abort()
  }

  return (
    <div className="w-full max-w-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-slate-100">Diagnostics</h1>
        <p className="mt-1 text-sm text-slate-500">
          Trigger any SDK method directly and inspect the result or error. Switch the{' '}
          <span className="text-slate-300">Transport</span> in the sidebar to simulate error
          scenarios.
        </p>
      </div>

      {/* Current scenario banner */}
      <div
        className={`flex items-start gap-3 rounded-lg border p-4 text-sm ${
          config.mockScenario === 'real'
            ? 'border-slate-800 bg-slate-900'
            : 'border-amber-800/40 bg-amber-500/5'
        }`}
      >
        <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-current opacity-80" />
        <div>
          <div className="font-medium text-slate-200">{currentScenario.label}</div>
          <div className="mt-0.5 text-xs text-slate-500">{currentScenario.description}</div>
        </div>
        {config.mockScenario === 'real' && !config.apiKey && (
          <div className="ml-auto text-xs text-amber-500">
            No API key — set one in the sidebar for authenticated calls
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] h-[calc(100vh-140px)] min-h-[500px]">
        {/* SDK call selector */}
        <div className="flex flex-col rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-sm max-h-full">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 shrink-0">
            SDK Method
          </h2>
          <div className="flex-1 space-y-2 overflow-y-auto pr-2 min-h-0">
            {SDK_CALLS.map((call) => {
              const isSelected = selectedCallId === call.id
              const isRunningThis = isSelected && result.status === 'loading'
              
              return (
                <div
                  key={call.id}
                  className={`flex flex-col gap-3 rounded-lg border p-3 transition-colors cursor-pointer ${
                    isSelected
                      ? 'border-cyan-700/50 bg-cyan-950/40'
                      : 'border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                  }`}
                  onClick={() => {
                    if (!isSelected) {
                      setSelectedCallId(call.id)
                      setResult({ status: 'idle' })
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="font-mono text-xs text-slate-200">{call.label}</div>
                      <div className="mt-0.5 text-[11px] text-slate-500">{call.description}</div>
                    </div>
                    {call.requiresAuth && (
                      <span className="shrink-0 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
                        auth
                      </span>
                    )}
                  </div>
                  
                  {/* Inline Run Controls for the selected card */}
                  {isSelected && (
                    <div className="flex gap-2 pt-2 mt-1 border-t border-slate-800/40">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRun()
                        }}
                        disabled={isRunningThis}
                        className="flex-1 rounded border border-cyan-500/20 bg-cyan-500/10 py-1.5 text-xs font-medium text-cyan-400 transition-colors hover:bg-cyan-500/20 hover:text-cyan-300 disabled:opacity-40"
                      >
                        {isRunningThis ? 'Running…' : 'Run Method'}
                      </button>
                      {isRunningThis && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAbort()
                          }}
                          className="shrink-0 rounded border border-red-800/50 bg-red-500/10 px-4 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20 hover:text-red-300"
                        >
                          Abort
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Result panel */}
        <div className="flex flex-col space-y-3 rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-sm max-h-full overflow-y-auto">
          <div className="flex items-center justify-between shrink-0">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Result
            </h2>
            {(result.status === 'success' || result.status === 'error') && (
              <span className="tabular-nums text-[11px] text-slate-600">
                {result.durationMs}ms
              </span>
            )}
          </div>

          {result.status === 'idle' && (
            <p className="text-xs text-slate-700">Press Run to execute the selected method.</p>
          )}

          {result.status === 'loading' && (
            <div className="space-y-2">
              {[60, 80, 45].map((w, i) => (
                <div
                  key={i}
                  className="h-3 animate-pulse rounded bg-slate-800"
                  style={{ width: `${w}%` }}
                />
              ))}
              <p className="pt-1 text-[11px] text-slate-600">
                {config.mockScenario === 'timeout'
                  ? `Waiting for timeout (${config.timeoutMs / 1000}s)…`
                  : 'Waiting for response…'}
              </p>
            </div>
          )}

          {result.status === 'success' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="text-xs font-medium text-emerald-400">Success</span>
              </div>
              <JsonViewer data={result.data} />
            </div>
          )}

          {result.status === 'error' && (
            <div className="space-y-2">
              <ErrorCard error={result.error} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
