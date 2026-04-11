import type { Session } from '@octaspace/sdk'
import { useSessions } from '@octaspace/sdk-react'
import type React from 'react'
import { useState } from 'react'
import { ErrorCard } from '../components/error-card'
import { JsonViewer, JsonViewerSkeleton } from '../components/json-viewer'
import { useClientContext } from '../store/client-context'

type SessionRow = Session & {
  kind?: string
  termination_reason?: number | string
}

// ─── Service/status formatting (mirrors Cube marketplace sessions) ───────────

const SERVICE_BADGE: Record<string, string> = {
  mr: 'bg-sky-900/30 text-sky-400 border border-sky-500/30',
  render: 'bg-orange-900/30 text-orange-400 border border-orange-500/30',
  vpn: 'bg-indigo-900/30 text-indigo-400 border border-indigo-500/30',
}

const TERMINATION_REASON = {
  normal: 0,
  idle_limit: 1,
} as const

function extractV2RayProtocol(config: string | undefined): string | null {
  if (!config) return null
  if (config.startsWith('trojan://')) return 'trojan'
  if (config.startsWith('vless://')) return 'vless'
  if (config.startsWith('vmess://')) return 'vmess'
  return null
}

function formatSessionService(session: SessionRow): string {
  if (session.service === 'mr') return 'RENTAL'
  if (session.service === 'vpn') return 'VPN'
  if (session.service === 'render') return 'RENDER'
  return '—'
}

function serviceBadge(service: string | undefined): string {
  if (!service) return 'bg-slate-700/50 text-slate-400 border border-slate-600/40'
  return SERVICE_BADGE[service] ?? 'bg-slate-700/50 text-slate-400 border border-slate-600/40'
}

function isNormalTerminationReason(reason: number | string | undefined): boolean {
  const parsed = typeof reason === 'string' ? Number.parseInt(reason, 10) : reason
  return parsed === TERMINATION_REASON.normal || parsed === TERMINATION_REASON.idle_limit
}

function formatSessionStatus(session: SessionRow, recent: boolean): string {
  if (recent && session.termination_reason !== undefined && session.termination_reason !== null) {
    return isNormalTerminationReason(session.termination_reason) ? 'Normal' : 'Error'
  }

  if (session.is_ready) return 'Ready'
  if (session.progress) return session.progress
  return 'Starting'
}

function statusBadgeClass(session: SessionRow, recent: boolean): string {
  if (recent && session.termination_reason !== undefined && session.termination_reason !== null) {
    return isNormalTerminationReason(session.termination_reason)
      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
      : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
  }

  return session.is_ready
    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
    : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
}

// ─── Utility formatters ───────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  if (!seconds) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function formatBytes(bytes: number | undefined): string {
  const n = Number(bytes)
  if (!n || !Number.isFinite(n)) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let v = n
  let i = 0
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++ }
  return `${v.toFixed(1)} ${units[i]}`
}

function formatDate(tsMs: number | undefined): string {
  if (!tsMs) return '—'
  return new Date(tsMs).toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function truncateUuid(uuid: string): string {
  if (uuid.length <= 16) return uuid
  return `${uuid.slice(0, 8)}…${uuid.slice(-5)}`
}

// ─── Table with dynamic columns ──────────────────────────────────────────────

interface ColDef {
  key: string
  label: string
  visible: (rows: SessionRow[]) => boolean
  cell: (s: SessionRow) => React.ReactNode
  align?: 'right'
}

const CURRENT_COLS: ColDef[] = [
  {
    key: 'uuid',
    label: 'Session',
    visible: () => true,
    cell: (s) => (
      <span className="font-mono text-slate-300 tabular-nums" title={s.uuid}>
        {truncateUuid(s.uuid)}
      </span>
    ),
  },
  {
    key: 'node',
    label: 'Node ID',
    visible: () => true,
    cell: (s) => <span className="tabular-nums text-slate-400">#{s.node_id}</span>,
  },
  {
    key: 'service',
    label: 'Service',
    visible: () => true,
    cell: (s) => (
      <span className={`w-fit rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide ${serviceBadge(s.service)}`}>
        {formatSessionService(s)}
      </span>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    visible: () => true,
    cell: (s) => (
      <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${statusBadgeClass(s, false)}`}>
        {formatSessionStatus(s, false)}
      </span>
    ),
  },
  {
    key: 'started',
    label: 'Started',
    visible: (rows) => rows.some((r) => r.started_at),
    cell: (s) => <span className="tabular-nums text-slate-400">{formatDate(s.started_at)}</span>,
  },
  {
    key: 'duration',
    label: 'Duration',
    visible: () => true,
    cell: (s) => <span className="tabular-nums text-slate-400">{formatDuration(s.duration)}</span>,
  },
  {
    key: 'traffic',
    label: 'Traffic ↓/↑',
    visible: (rows) => rows.some((r) => r.rx || r.tx),
    cell: (s) => (
      <span className="tabular-nums text-slate-400">
        {formatBytes(s.rx)} / {formatBytes(s.tx)}
      </span>
    ),
  },
  {
    key: 'ip',
    label: 'IP',
    visible: (rows) => rows.some((r) => r.public_ip || r.ip),
    cell: (s) => <span className="font-mono text-slate-400">{s.public_ip ?? s.ip ?? '—'}</span>,
  },
  {
    key: 'amount',
    label: 'Amount',
    visible: (rows) => rows.some((r) => r.charge_amount !== undefined),
    align: 'right',
    cell: (s) => (
      <span className="tabular-nums text-slate-400">
        {s.charge_amount !== undefined ? String(s.charge_amount) : '—'}
      </span>
    ),
  },
]

// Recent adds "Finished" and omits the stop action
const RECENT_COLS: ColDef[] = [
  ...CURRENT_COLS.slice(0, 3),
  {
    key: 'status',
    label: 'Status',
    visible: () => true,
    cell: (s) => (
      <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${statusBadgeClass(s, true)}`}>
        {formatSessionStatus(s, true)}
      </span>
    ),
  },
  {
    key: 'started',
    label: 'Started',
    visible: (rows) => rows.some((r) => r.started_at),
    cell: (s) => <span className="tabular-nums text-slate-400">{formatDate(s.started_at)}</span>,
  },
  {
    key: 'duration',
    label: 'Duration',
    visible: () => true,
    cell: (s) => <span className="tabular-nums text-slate-400">{formatDuration(s.duration)}</span>,
  },
  {
    key: 'traffic',
    label: 'Traffic ↓/↑',
    visible: (rows) => rows.some((r) => r.rx || r.tx),
    cell: (s) => (
      <span className="tabular-nums text-slate-400">
        {formatBytes(s.rx)} / {formatBytes(s.tx)}
      </span>
    ),
  },
  {
    key: 'amount',
    label: 'Amount',
    visible: (rows) => rows.some((r) => r.charge_amount !== undefined),
    align: 'right',
    cell: (s) => (
      <span className="tabular-nums text-slate-400">
        {s.charge_amount !== undefined ? String(s.charge_amount) : '—'}
      </span>
    ),
  },
]

function SessionsTable({
  sessions,
  recent,
  onStop,
}: {
  sessions: SessionRow[]
  recent: boolean
  onStop: (uuid: string) => void
}) {
  const cols = (recent ? RECENT_COLS : CURRENT_COLS).filter((c) => c.visible(sessions))

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px] table-auto">
        <thead>
          <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-600">
            {cols.map((c) => (
              <th
                key={c.key}
                className={`px-3 py-2 font-medium whitespace-nowrap ${c.align === 'right' ? 'text-right' : 'text-left'}`}
              >
                {c.label}
              </th>
            ))}
            {!recent && <th className="px-3 py-2 text-right font-medium">Action</th>}
          </tr>
        </thead>
        <tbody>
          {sessions.map((s) => (
            <tr key={s.uuid} className="border-b border-slate-800/60 text-xs transition-colors hover:bg-slate-800/40">
              {cols.map((c) => (
                <td key={c.key} className={`px-3 py-2.5 whitespace-nowrap ${c.align === 'right' ? 'text-right' : ''}`}>
                  {c.cell(s)}
                </td>
              ))}
              {!recent && (
                <td className="px-3 py-2.5 text-right">
                  <button
                    type="button"
                    onClick={() => onStop(s.uuid)}
                    className="rounded border border-red-800/50 px-2 py-0.5 text-[11px] text-red-500 transition-colors hover:border-red-600 hover:text-red-400"
                  >
                    Stop
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Stop confirm dialog ──────────────────────────────────────────────────────

function StopConfirmDialog({
  uuid,
  onConfirm,
  onCancel,
  isLoading,
}: {
  uuid: string
  onConfirm: () => void
  onCancel: () => void
  isLoading: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <h3 className="text-sm font-semibold text-slate-100">Stop session?</h3>
        <p className="mt-2 text-xs text-slate-400">
          This will stop session{' '}
          <span className="font-mono text-slate-200">{uuid.slice(0, 12)}…</span>. This action
          cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded border border-slate-700 px-3 py-1.5 text-xs text-slate-400 transition-colors hover:border-slate-600 hover:text-slate-200 disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="rounded bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-40"
          >
            {isLoading ? 'Stopping…' : 'Stop session'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Tab panel ────────────────────────────────────────────────────────────────

type TabId = 'current' | 'recent'

const TABS: { id: TabId; label: string; description: string }[] = [
  { id: 'current', label: 'Current', description: 'Active sessions' },
  { id: 'recent', label: 'Recent', description: 'Last 50 completed + active' },
]

function SessionsPanel({
  recent,
  onStopRequest,
}: {
  recent: boolean
  onStopRequest: (uuid: string) => void
}) {
  const sessions = useSessions({ recent })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <code className="text-[11px] text-cyan-500">
          {recent ? 'useSessions({ recent: true })' : 'useSessions({})'}
        </code>
        <button
          type="button"
          onClick={sessions.refetch}
          disabled={sessions.loading}
          className="rounded border border-slate-700 px-2.5 py-1 text-xs text-slate-400 transition-colors hover:border-slate-600 hover:text-slate-200 disabled:opacity-40"
        >
          Refetch
        </button>
      </div>

      {sessions.loading && <JsonViewerSkeleton maxHeight="max-h-48" />}
      {sessions.error && <ErrorCard error={sessions.error} />}

      {sessions.data && (
        sessions.data.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 px-6 py-12 text-center">
            <p className="text-sm text-slate-500">
              No {recent ? 'recent' : 'active'} sessions found.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
              <div className="border-b border-slate-800 px-4 py-3 text-xs text-slate-400">
                {sessions.data.length} session{sessions.data.length !== 1 ? 's' : ''}
              </div>
              <SessionsTable sessions={sessions.data} recent={recent} onStop={onStopRequest} />
            </div>

            <details className="group">
              <summary className="cursor-pointer text-xs text-slate-600 transition-colors hover:text-slate-400">
                Raw JSON response ▸
              </summary>
              <div className="mt-2">
                <JsonViewer data={sessions.data} />
              </div>
            </details>
          </>
        )
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function SessionsPage() {
  const [tab, setTab] = useState<TabId>('current')
  const { client } = useClientContext()

  const [confirmUuid, setConfirmUuid] = useState<string | null>(null)
  const [stopping, setStopping] = useState(false)
  const [stopError, setStopError] = useState<unknown>(null)

  // Mounted alongside the panel — used to refetch current list after stop
  const currentSessions = useSessions({ recent: false })

  async function handleConfirmStop() {
    if (!confirmUuid) return
    setStopping(true)
    setStopError(null)
    try {
      await client.services.session(confirmUuid).stop()
      setConfirmUuid(null)
      currentSessions.refetch()
    } catch (err) {
      setStopError(err)
    } finally {
      setStopping(false)
    }
  }

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-slate-100">Sessions</h1>
        <p className="mt-1 text-sm text-slate-500">
          <code className="text-cyan-400">useSessions()</code> — uses{' '}
          <code className="text-cyan-400">sdk-react</code>. Stop calls{' '}
          <code className="text-cyan-400">client.services.session(uuid).stop()</code> directly.
        </p>
      </div>

      {stopError != null && <ErrorCard error={stopError} />}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-800">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
              tab === t.id
                ? '-mb-px border-b-2 border-cyan-500 font-medium text-cyan-400'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {t.label}
            <span className="text-[10px] text-slate-600">{t.description}</span>
          </button>
        ))}
      </div>

      {/* Tab panels — both mounted to keep cache alive, hidden when inactive */}
      <div className={tab === 'current' ? '' : 'hidden'}>
        <SessionsPanel recent={false} onStopRequest={setConfirmUuid} />
      </div>
      <div className={tab === 'recent' ? '' : 'hidden'}>
        <SessionsPanel recent={true} onStopRequest={setConfirmUuid} />
      </div>

      {/* Stop confirmation dialog */}
      {confirmUuid && (
        <StopConfirmDialog
          uuid={confirmUuid}
          onConfirm={handleConfirmStop}
          onCancel={() => setConfirmUuid(null)}
          isLoading={stopping}
        />
      )}
    </div>
  )
}
