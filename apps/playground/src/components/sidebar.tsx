import { Link } from '@tanstack/react-router'
import { type MockScenario, MOCK_SCENARIOS } from '../mocks/fetch'
import { useClientContext } from '../store/client-context'

const NAV_ITEMS = [
  { to: '/' as const, label: 'Dashboard', exact: true, badge: null },
  { to: '/network' as const, label: 'Network', exact: false, badge: 'public' },
  { to: '/nodes' as const, label: 'Nodes', exact: false, badge: null },
  { to: '/sessions' as const, label: 'Sessions', exact: false, badge: null },
  { to: '/services' as const, label: 'Services', exact: false, badge: null },
  { to: '/diagnostics' as const, label: 'Diagnostics', exact: false, badge: 'mock' },
]

const BASE_CLS =
  'flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors'
const INACTIVE_CLS = `${BASE_CLS} text-slate-400 hover:bg-slate-800 hover:text-slate-100`
const ACTIVE_CLS = `${BASE_CLS} bg-slate-800 text-cyan-400`

export function Sidebar() {
  const { config, setConfig } = useClientContext()

  return (
    <aside className="flex w-64 shrink-0 flex-col overflow-y-auto border-r border-slate-800 bg-slate-900">
      {/* Logo */}
      <div className="border-b border-slate-800 px-5 py-5">
        <div className="text-sm font-semibold text-slate-100">OctaSpace</div>
        <div className="mt-0.5 text-xs text-slate-500">SDK Playground</div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 p-3">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={{ exact: item.exact }}
            className={INACTIVE_CLS}
            activeProps={{ className: ACTIVE_CLS }}
          >
            <span>{item.label}</span>
            {item.badge === 'public' && (
              <span className="text-[10px] font-medium text-emerald-500">public</span>
            )}
            {item.badge === 'mock' && (
              <span className="text-[10px] font-medium text-violet-400">mock</span>
            )}
          </Link>
        ))}
      </nav>

      {/* Config panel */}
      <div className="space-y-4 border-t border-slate-800 p-4">
        {/* API Key */}
        <div>
          <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-slate-500">
            API Key
          </label>
          <div className="relative">
            <input
              type="password"
              value={config.apiKey}
              onChange={(e) => setConfig({ apiKey: e.target.value })}
              placeholder="Enter API key…"
              className="w-full rounded border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
            {config.apiKey && (
              <span className="absolute right-2 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-emerald-500" />
            )}
          </div>
        </div>

        {/* Transport / Mock scenario */}
        <div>
          <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-slate-500">
            Transport
          </label>
          <select
            value={config.mockScenario}
            onChange={(e) => setConfig({ mockScenario: e.target.value as MockScenario })}
            className="w-full rounded border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            {MOCK_SCENARIOS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          {config.mockScenario !== 'real' && (
            <p className="mt-1 text-[10px] text-amber-500">
              ⚠ Mock active — requests intercepted
            </p>
          )}
        </div>

        {/* Base URL */}
        <div>
          <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-slate-500">
            Base URL
          </label>
          <input
            type="text"
            value={config.baseUrl}
            onChange={(e) => setConfig({ baseUrl: e.target.value })}
            className="w-full rounded border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>
      </div>
    </aside>
  )
}
