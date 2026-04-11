import { useAccount, useBalance, useNetworkStats } from '@octaspace/sdk-react'
import { useState } from 'react'
import { ErrorCard } from '../components/error-card'
import { JsonViewer, JsonViewerSkeleton } from '../components/json-viewer'
import { useClientContext } from '../store/client-context'

type Tab = 'formatted' | 'raw'

interface ResourcePanelProps {
  title: string
  hook: string
  isLoading: boolean
  error: unknown
  data: unknown
  onRefetch: () => void
  /** When true, renders a locked placeholder instead of fetching */
  locked?: boolean
}

function ResourcePanel({ title, hook, isLoading, error, data, onRefetch, locked }: ResourcePanelProps) {
  const [tab, setTab] = useState<Tab>('formatted')

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
          <code className="mt-0.5 text-[11px] text-cyan-500">{hook}</code>
        </div>
        <button
          type="button"
          onClick={onRefetch}
          disabled={isLoading || locked}
          className="rounded px-2.5 py-1 text-xs text-slate-400 border border-slate-700 hover:border-slate-600 hover:text-slate-200 transition-colors disabled:opacity-40"
        >
          Refetch
        </button>
      </div>

      {locked ? (
        <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-5 text-xs text-slate-600">
          <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V7a4.5 4.5 0 0 0-9 0v3.5M5 10.5h14a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8.5a1 1 0 0 1 1-1z" />
          </svg>
          Enter an API key in the sidebar to load this resource
        </div>
      ) : (
        <>
          {/* Tabs */}
          {data != null && (
            <div className="flex gap-1 border-b border-slate-800 pb-0">
              {(['formatted', 'raw'] as Tab[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`px-3 py-1.5 text-xs transition-colors capitalize ${
                    tab === t
                      ? 'border-b-2 border-cyan-500 text-cyan-400 -mb-px'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {t === 'raw' ? 'Raw JSON' : 'Formatted'}
                </button>
              ))}
            </div>
          )}

          {/* Content */}
          {isLoading && <JsonViewerSkeleton />}
          {error != null && <ErrorCard error={error} />}
          {data != null && !isLoading && (
            tab === 'raw'
              ? <pre className="overflow-auto rounded-lg border border-slate-800 bg-slate-950 p-4 font-mono text-xs leading-relaxed max-h-96 text-slate-300 whitespace-pre-wrap break-all">{JSON.stringify(data, null, 2)}</pre>
              : <JsonViewer data={data} />
          )}
        </>
      )}
    </div>
  )
}

function NetworkPanel() {
  const stats = useNetworkStats()

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-100">Network Stats</h2>
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
              public
            </span>
          </div>
          <code className="mt-0.5 text-[11px] text-cyan-500">useNetworkStats()</code>
        </div>
        <button
          type="button"
          onClick={stats.refetch}
          disabled={stats.loading}
          className="rounded px-2.5 py-1 text-xs text-slate-400 border border-slate-700 hover:border-slate-600 hover:text-slate-200 transition-colors disabled:opacity-40"
        >
          Refetch
        </button>
      </div>
      {stats.loading && <JsonViewerSkeleton maxHeight="max-h-40" />}
      {stats.error != null && <ErrorCard error={stats.error} />}
      {stats.data != null && !stats.loading && <JsonViewer data={stats.data} maxHeight="max-h-40" />}
    </div>
  )
}

export function IndexPage() {
  const { config } = useClientContext()
  const hasKey = Boolean(config.apiKey)

  const account = useAccount({ enabled: hasKey })
  const balance = useBalance({ enabled: hasKey })

  return (
    <div className="w-full max-w-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-slate-100">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Account health check. Demonstrates{' '}
          <code className="text-cyan-400">@octaspace/sdk-react</code> hooks.
        </p>
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm">
        <span
          className={`h-2 w-2 rounded-full ${hasKey ? 'bg-emerald-500' : 'bg-slate-600'}`}
        />
        <span className="text-slate-400">
          {hasKey ? (
            <>
              API key set —{' '}
              <span className="font-mono text-slate-300">{config.baseUrl}</span>
            </>
          ) : (
            'No API key — enter one in the sidebar to test authenticated endpoints'
          )}
        </span>
        {config.mockScenario !== 'real' && (
          <span className="ml-auto rounded bg-amber-500/20 px-2 py-0.5 text-[11px] font-medium text-amber-400">
            Mock: {config.mockScenario}
          </span>
        )}
      </div>

      {/* Public data — always visible */}
      <NetworkPanel />

      {/* Authenticated resource panels */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ResourcePanel
          title="Account"
          hook="useAccount()"
          isLoading={account.loading}
          error={account.error}
          data={account.data}
          onRefetch={account.refetch}
          locked={!hasKey}
        />
        <ResourcePanel
          title="Balance"
          hook="useBalance()"
          isLoading={balance.loading}
          error={balance.error}
          data={balance.data}
          onRefetch={balance.refetch}
          locked={!hasKey}
        />
      </div>
    </div>
  )
}
