import { useClientContext } from '../store/client-context'
import { MethodBadge, StatusBadge } from './status-badge'

export function RequestLog() {
  const { log, clearLog, config } = useClientContext()

  return (
    <div className="shrink-0 border-t border-slate-800 bg-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Request Log
          </span>
          {log.length > 0 && (
            <span className="rounded-full bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400 tabular-nums">
              {log.length}
            </span>
          )}
        </div>
        {log.length > 0 && (
          <button
            type="button"
            onClick={clearLog}
            className="text-xs text-slate-600 transition-colors hover:text-slate-400"
          >
            Clear
          </button>
        )}
      </div>

      {/* Entries */}
      <div className="h-36 overflow-y-auto">
        {log.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-slate-700">
            No requests yet
          </div>
        ) : (
          <table className="w-full text-xs">
            <tbody>
              {log.map((entry) => (
                <tr key={entry.id} className={`border-b border-slate-900 hover:bg-slate-900/50 ${entry.errorMessage ? 'bg-red-500/5' : ''}`}>
                  <td className="w-16 px-3 py-1.5">
                    <MethodBadge method={entry.method} />
                  </td>
                  <td
                    className="max-w-xs truncate px-2 py-1.5 font-mono text-slate-400"
                    title={entry.url}
                  >
                    {entry.url.replace(config.baseUrl, '')}
                  </td>
                  <td className="w-14 px-2 py-1.5">
                    {entry.errorMessage ? (
                      <span
                        className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-red-500/20 text-red-400"
                        title={entry.errorMessage}
                      >
                        ERR
                      </span>
                    ) : (
                      <StatusBadge status={entry.status} />
                    )}
                  </td>
                  <td className="w-20 px-2 py-1.5 text-right tabular-nums text-slate-500">
                    {entry.durationMs}ms
                  </td>
                  <td className="w-14 px-2 py-1.5 text-center tabular-nums">
                    {entry.attempt > 1 && (
                      <span className="text-amber-500" title={`Attempt ${entry.attempt}`}>
                        ×{entry.attempt}
                      </span>
                    )}
                  </td>
                  <td className="w-20 px-3 py-1.5 text-right tabular-nums text-slate-700">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
