interface StatusBadgeProps {
  status: number
  className?: string
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const group = Math.floor(status / 100)
  const colors =
    group === 2
      ? 'bg-emerald-500/20 text-emerald-400 ring-emerald-500/30'
      : group === 3
        ? 'bg-sky-500/20 text-sky-400 ring-sky-500/30'
        : group === 4
          ? 'bg-amber-500/20 text-amber-400 ring-amber-500/30'
          : 'bg-red-500/20 text-red-400 ring-red-500/30'

  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 font-mono text-xs font-medium ring-1 ring-inset ${colors} ${className}`}
    >
      {status}
    </span>
  )
}

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-emerald-500/20 text-emerald-400 ring-emerald-500/30',
  POST: 'bg-blue-500/20 text-blue-400 ring-blue-500/30',
  PATCH: 'bg-amber-500/20 text-amber-400 ring-amber-500/30',
  DELETE: 'bg-red-500/20 text-red-400 ring-red-500/30',
}

export function MethodBadge({ method }: { method: string }) {
  const cls = METHOD_COLORS[method] ?? 'bg-slate-500/20 text-slate-400 ring-slate-500/30'
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 font-mono text-xs font-semibold ring-1 ring-inset ${cls}`}
    >
      {method}
    </span>
  )
}
