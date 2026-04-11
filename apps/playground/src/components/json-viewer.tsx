import { useState } from 'react'

/**
 * Syntax-highlights a JSON string with HTML spans.
 * HTML-escapes the input first to prevent XSS.
 * Safe for displaying API response data in a dev tool context.
 */
function syntaxHighlight(json: string): string {
  const escaped = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return escaped.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
    (match) => {
      if (/^"/.test(match)) {
        return /:$/.test(match)
          ? `<span class="json-key">${match}</span>`
          : `<span class="json-string">${match}</span>`
      }
      if (/true|false/.test(match)) return `<span class="json-bool">${match}</span>`
      if (/null/.test(match)) return `<span class="json-null">${match}</span>`
      return `<span class="json-number">${match}</span>`
    },
  )
}

interface JsonViewerProps {
  data: unknown
  /** Tailwind max-height class, e.g. "max-h-96" */
  maxHeight?: string
}

export function JsonViewer({ data, maxHeight = 'max-h-96' }: JsonViewerProps) {
  const [copied, setCopied] = useState(false)

  const json = JSON.stringify(data, null, 2)
  const highlighted = syntaxHighlight(json)

  function handleCopy() {
    void navigator.clipboard.writeText(json).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1_500)
    })
  }

  return (
    <div className="relative rounded-lg border border-slate-800 bg-slate-950">
      <button
        type="button"
        onClick={handleCopy}
        className="absolute right-2 top-2 z-10 rounded px-2 py-1 text-xs text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
      <pre
        className={`overflow-auto p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap break-all ${maxHeight}`}
        // Safe: HTML-escaped before highlighting; used only for displaying API response data
        // biome-ignore lint/security/noDangerouslySetInnerHtml: intentional — internal JSON syntax highlighting
        dangerouslySetInnerHTML={{ __html: highlighted }}
      />
    </div>
  )
}

/** Skeleton placeholder for loading state */
export function JsonViewerSkeleton({ maxHeight = 'max-h-96' }: { maxHeight?: string }) {
  return (
    <div className={`overflow-hidden rounded-lg border border-slate-800 bg-slate-950 p-4 ${maxHeight}`}>
      <div className="space-y-2">
        {[60, 80, 45, 70, 55, 90, 40].map((w, i) => (
          <div
            key={i}
            className="h-3 animate-pulse rounded bg-slate-800"
            style={{ width: `${w}%` }}
          />
        ))}
      </div>
    </div>
  )
}
