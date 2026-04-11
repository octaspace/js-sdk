import {
  OctaApiError,
  OctaError,
  OctaNetworkError,
  OctaRateLimitError,
} from '@octaspace/sdk'
import { JsonViewer } from './json-viewer'

interface ErrorCardProps {
  error: unknown
}

export function ErrorCard({ error }: ErrorCardProps) {
  if (!(error instanceof OctaError)) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
        Unexpected error: {String(error)}
      </div>
    )
  }

  const details: Record<string, unknown> = { message: error.message }

  if (error instanceof OctaApiError) {
    details['status'] = error.status
    if (error.code) details['code'] = error.code
    if (error.requestId) details['requestId'] = error.requestId
    if (error.body !== undefined) details['body'] = error.body
    if (error instanceof OctaRateLimitError && error.retryAfter !== undefined) {
      details['retryAfter'] = `${error.retryAfter}s`
    }
  }

  const isNetwork = error instanceof OctaNetworkError && !(error instanceof OctaApiError)
  const tag = error instanceof OctaApiError
    ? `HTTP ${error.status}`
    : isNetwork
      ? 'Network / Transport'
      : 'SDK Error'

  return (
    <div className="space-y-3 rounded-lg border border-red-500/30 bg-red-500/5 p-4">
      <div className="flex items-center gap-3">
        <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />
        <span className="font-mono text-sm font-semibold text-red-400">{error.name}</span>
        <span className="text-xs text-slate-500">{tag}</span>
      </div>
      <JsonViewer data={details} maxHeight="max-h-48" />
    </div>
  )
}
