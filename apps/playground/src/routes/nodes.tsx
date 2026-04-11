import type { Node } from '@octaspace/sdk'
import { useNode, useNodes } from '@octaspace/sdk-react'
import { useState } from 'react'
import { ErrorCard } from '../components/error-card'
import { JsonViewer, JsonViewerSkeleton } from '../components/json-viewer'
import { StatusBadge } from '../components/status-badge'

function NodeRow({
  node,
  selected,
  onClick,
}: {
  node: Node
  selected: boolean
  onClick: () => void
}) {
  const gpuCount = node.system.gpus.length
  const gpuModel = node.system.gpus[0]?.model ?? '—'
  const ramGb = Math.round(node.system.memory.size / 1024 / 1024 / 1024)

  return (
    <tr
      onClick={onClick}
      className={`cursor-pointer border-b border-slate-800 text-xs transition-colors hover:bg-slate-800/60 ${
        selected ? 'bg-slate-800/80' : ''
      }`}
    >
      <td className="px-3 py-2.5 font-mono text-slate-300">{node.id}</td>
      <td className="px-3 py-2.5 text-slate-400">
        {node.location.city}, {node.location.country}
      </td>
      <td className="px-3 py-2.5 text-slate-400">{node.system.cpu_cores} cores</td>
      <td className="px-3 py-2.5 text-slate-400">
        {gpuCount}× <span className="text-slate-300">{gpuModel}</span>
      </td>
      <td className="px-3 py-2.5 tabular-nums text-slate-400">{ramGb} GB</td>
      <td className="px-3 py-2.5">
        <span
          className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${
            node.state === 'active'
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-slate-700 text-slate-400'
          }`}
        >
          {node.state}
        </span>
      </td>
    </tr>
  )
}

function NodeDetail({ id }: { id: number }) {
  const node = useNode(id)
  const [tab, setTab] = useState<'summary' | 'raw'>('summary')

  return (
    <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">Node #{id}</h2>
          <code className="text-[11px] text-cyan-500">{`useNode(${id})`}</code>
        </div>
        {node.loading && (
          <span className="text-xs text-slate-500">Loading…</span>
        )}
      </div>

      {node.loading && <JsonViewerSkeleton />}
      {node.error && <ErrorCard error={node.error} />}
      {node.data && (
        <>
          <div className="flex gap-1">
            {(['summary', 'raw'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 text-xs capitalize transition-colors ${
                  tab === t
                    ? 'border-b-2 border-cyan-500 text-cyan-400 -mb-px'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {t === 'raw' ? 'Raw JSON' : t}
              </button>
            ))}
          </div>

          {tab === 'summary' ? (
            <div className="flex flex-col text-xs">
              {[
                ['State', node.data.state],
                ['IP', node.data.ip],
                ['Location', `${node.data.location.city}, ${node.data.location.country}`],
                ['CPU', node.data.data.cpu_model_name],
                ['Cores', String(node.data.data.cpu_cores)],
                ['CUDA', node.data.data.cuda_version],
                ['OS', node.data.data.os_version],
                ['Driver', node.data.data.gpu_driver_version ?? '—'],
                ['Uptime', `${Math.floor(node.data.data.uptime / 3600)}h`],
                ['GPU vendor', node.data.data.gpu_vendor],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between items-center gap-4 border-b border-slate-800/60 py-2">
                  <span className="text-slate-500 shrink-0">{k}</span>
                  <span className="font-mono text-slate-300 text-right min-w-0 break-words">{v}</span>
                </div>
              ))}
            </div>
          ) : (
            <JsonViewer data={node.data} />
          )}
        </>
      )}
    </div>
  )
}

export function NodesPage() {
  const nodes = useNodes()
  const [selectedId, setSelectedId] = useState<number | null>(null)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">Nodes</h1>
          <p className="mt-1 text-sm text-slate-500">
            <code className="text-cyan-400">useNodes()</code> +{' '}
            <code className="text-cyan-400">useNode(id)</code> — click a row to load detail.
          </p>
        </div>
        <button
          type="button"
          onClick={nodes.refetch}
          disabled={nodes.loading}
          className="rounded border border-slate-700 px-3 py-1.5 text-xs text-slate-400 transition-colors hover:border-slate-600 hover:text-slate-200 disabled:opacity-40"
        >
          Refetch
        </button>
      </div>

      {nodes.loading && <JsonViewerSkeleton maxHeight="max-h-48" />}
      {nodes.error && <ErrorCard error={nodes.error} />}

      {nodes.data && (
        <div className={`grid gap-6 ${selectedId !== null ? 'lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] grid-cols-1' : 'grid-cols-1'}`}>
          {/* Table */}
          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <span className="text-xs font-medium text-slate-400">
                {nodes.data.length} nodes
              </span>
              {selectedId !== null && (
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
                >
                  Close detail
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-600">
                    <th className="px-3 py-2 text-left font-medium">ID</th>
                    <th className="px-3 py-2 text-left font-medium">Location</th>
                    <th className="px-3 py-2 text-left font-medium">CPU</th>
                    <th className="px-3 py-2 text-left font-medium">GPU</th>
                    <th className="px-3 py-2 text-left font-medium">RAM</th>
                    <th className="px-3 py-2 text-left font-medium">State</th>
                  </tr>
                </thead>
                <tbody>
                  {nodes.data.map((node) => (
                    <NodeRow
                      key={node.id}
                      node={node}
                      selected={selectedId === node.id}
                      onClick={() => setSelectedId(node.id === selectedId ? null : node.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detail panel */}
          {selectedId !== null && <NodeDetail id={selectedId} />}
        </div>
      )}
    </div>
  )
}
