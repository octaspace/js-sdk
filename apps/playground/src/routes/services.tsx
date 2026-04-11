/**
 * Services page — demonstrates sdk-query with useQuery for read operations.
 * Start mutations are intentionally preview-only (no real API call on submit).
 */
import { mrQueries, renderQueries, vpnQueries } from '@octaspace/sdk-query'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { ErrorCard } from '../components/error-card'
import { JsonViewer, JsonViewerSkeleton } from '../components/json-viewer'
import { useClientContext } from '../store/client-context'

type ServiceTab = 'mr' | 'render' | 'vpn'

const TABS: { id: ServiceTab; label: string; queryName: string }[] = [
  { id: 'mr', label: 'Machine Rental', queryName: 'mrQueries.available(client)' },
  { id: 'render', label: 'Render', queryName: 'renderQueries.available(client)' },
  { id: 'vpn', label: 'VPN', queryName: 'vpnQueries.available(client)' },
]

export function ServicesPage() {
  const { client } = useClientContext()
  const [tab, setTab] = useState<ServiceTab>('mr')

  const mr = useQuery(mrQueries.available(client))
  const render = useQuery(renderQueries.available(client))
  const vpn = useQuery(vpnQueries.available(client))

  const results = { mr, render, vpn }
  const active = results[tab]
  const activeTab = TABS.find((t) => t.id === tab)!

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-slate-100">Services</h1>
        <p className="mt-1 text-sm text-slate-500">
          Available resources for each service type. Uses{' '}
          <code className="text-violet-400">@octaspace/sdk-query</code> +{' '}
          <code className="text-violet-400">useQuery</code>.
        </p>
      </div>

      {/* Mutation safety notice */}
      <div className="rounded-lg border border-amber-800/40 bg-amber-500/5 px-4 py-3 text-xs text-amber-400">
        Start mutations (<code>mr.start()</code>, <code>render.start()</code>,{' '}
        <code>vpn.start()</code>) are available on the{' '}
        <code>client.services.*</code> resource but intentionally not wired up here — use the
        Diagnostics page to test mutations manually.
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-800">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm transition-colors ${
              tab === t.id
                ? 'border-b-2 border-cyan-500 text-cyan-400 -mb-px font-medium'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Active tab content */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <code className="text-[11px] text-violet-400">{activeTab.queryName}</code>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-500">
              status: <span className="text-slate-300">{active.status}</span>
            </span>
            <button
              type="button"
              onClick={() => active.refetch()}
              disabled={active.isFetching}
              className="rounded border border-slate-700 px-2.5 py-1 text-slate-400 transition-colors hover:border-slate-600 hover:text-slate-200 disabled:opacity-40"
            >
              Refetch
            </button>
          </div>
        </div>

        {active.isPending && <JsonViewerSkeleton />}
        {active.error && <ErrorCard error={active.error} />}
        {active.data && (
          <>
            <div className="text-xs text-slate-500">
              {Array.isArray(active.data)
                ? `${active.data.length} items`
                : typeof active.data === 'object' && active.data !== null
                  ? `${Object.keys(active.data).length} keys`
                  : ''}
            </div>
            <JsonViewer data={active.data} />
          </>
        )}
      </div>

      {/* Query key */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
        <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-slate-500">
          Query Key
        </div>
        <JsonViewer
          data={
            tab === 'mr'
              ? mrQueries.available(client).queryKey
              : tab === 'render'
                ? renderQueries.available(client).queryKey
                : vpnQueries.available(client).queryKey
          }
          maxHeight="max-h-20"
        />
      </div>
    </div>
  )
}
