/**
 * Network page — demonstrates BOTH integration patterns side-by-side:
 *   1. @octaspace/sdk-react  →  useNetworkStats()
 *   2. @octaspace/sdk-query  →  networkQueries.stats(client) + useQuery()
 *
 * The network endpoint is public (no API key required).
 */
import { networkQueries } from '@octaspace/sdk-query'
import { useNetworkStats } from '@octaspace/sdk-react'
import { useQuery } from '@tanstack/react-query'
import { ErrorCard } from '../components/error-card'
import { JsonViewer, JsonViewerSkeleton } from '../components/json-viewer'
import { useClientContext } from '../store/client-context'

export function NetworkPage() {
  const { client } = useClientContext()

  // Pattern 1: sdk-react hook
  const reactHook = useNetworkStats()

  // Pattern 2: sdk-query + useQuery
  const queryResult = useQuery(networkQueries.stats(client))

  return (
    <div className="w-full max-w-full space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-slate-100">Network Stats</h1>
          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
            public
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Public endpoint — no API key required. Compare{' '}
          <code className="text-cyan-400">sdk-react</code> hooks vs{' '}
          <code className="text-violet-400">sdk-query</code> options side by side.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* sdk-react */}
        <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">sdk-react</h2>
              <code className="text-[11px] text-cyan-500">useNetworkStats()</code>
            </div>
            <button
              type="button"
              onClick={reactHook.refetch}
              disabled={reactHook.loading}
              className="rounded border border-slate-700 px-2.5 py-1 text-xs text-slate-400 transition-colors hover:border-slate-600 hover:text-slate-200 disabled:opacity-40"
            >
              Refetch
            </button>
          </div>
          <div className="space-y-1 text-xs text-slate-500">
            <div>
              loading: <span className="text-slate-300">{String(reactHook.loading)}</span>
            </div>
            <div>
              error: <span className="text-slate-300">{String(reactHook.error?.message ?? null)}</span>
            </div>
          </div>
          {reactHook.loading && <JsonViewerSkeleton />}
          {reactHook.error && <ErrorCard error={reactHook.error} />}
          {reactHook.data && <JsonViewer data={reactHook.data} />}
        </div>

        {/* sdk-query */}
        <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">sdk-query</h2>
              <code className="text-[11px] text-violet-400">
                useQuery(networkQueries.stats(client))
              </code>
            </div>
            <button
              type="button"
              onClick={() => queryResult.refetch()}
              disabled={queryResult.isFetching}
              className="rounded border border-slate-700 px-2.5 py-1 text-xs text-slate-400 transition-colors hover:border-slate-600 hover:text-slate-200 disabled:opacity-40"
            >
              Refetch
            </button>
          </div>
          <div className="space-y-1 text-xs text-slate-500">
            <div>
              status: <span className="text-slate-300">{queryResult.status}</span>
            </div>
            <div>
              fetchStatus: <span className="text-slate-300">{queryResult.fetchStatus}</span>
            </div>
            <div>
              dataUpdatedAt:{' '}
              <span className="text-slate-300 tabular-nums">
                {queryResult.dataUpdatedAt
                  ? new Date(queryResult.dataUpdatedAt).toLocaleTimeString()
                  : '—'}
              </span>
            </div>
          </div>
          {queryResult.isPending && <JsonViewerSkeleton />}
          {queryResult.error && <ErrorCard error={queryResult.error} />}
          {queryResult.data && <JsonViewer data={queryResult.data} />}
        </div>
      </div>

      {/* Query key reference */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
        <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-slate-500">
          Query Key
        </div>
        <JsonViewer
          data={networkQueries.stats(client).queryKey}
          maxHeight="max-h-20"
        />
      </div>
    </div>
  )
}
