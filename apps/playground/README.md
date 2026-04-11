# OctaSpace SDK Playground

Interactive development app for manually testing core read operations from all three SDK packages.

## Stack

- **Vite 6** + React 19 — fast HMR, no SSR overhead
- **TanStack Router** — type-safe client-side routing
- **TanStack Query v5** + DevTools — demonstrates `@octaspace/sdk-query`
- **Tailwind CSS v4** — dark dev-tool theme

## Quick start

```bash
# 1. Build SDK packages first (from repo root)
pnpm build

# 2. Install playground deps and start
pnpm playground          # alias for: pnpm --filter octaspace-playground dev
# → http://localhost:5173
```

### Live SDK development (HMR on SDK source changes)

Open two terminals:

```bash
# Terminal 1 — watch-rebuild all SDK packages
pnpm dev

# Terminal 2 — Vite dev server
pnpm playground
```

### Env var (optional)

Create `apps/playground/.env.local`:

```env
VITE_OCTA_API_KEY=your_key_here
```

If not set, enter the key in the sidebar at runtime.

## Pages

| Route | Package tested | Notes |
|-------|---------------|-------|
| `/` | `sdk-react` | `useAccount()`, `useBalance()` |
| `/network` | `sdk-react` + `sdk-query` | Side-by-side comparison, public endpoint |
| `/nodes` | `sdk-react` | `useNodes()` + `useNode(id)` — click row for detail |
| `/sessions` | `sdk-react` | `useSessions()` — Stop with confirmation dialog |
| `/services` | `sdk-query` | `mrQueries`, `renderQueries`, `vpnQueries` |
| `/diagnostics` | `sdk` (direct) | Run any method, test mock scenarios |

## Mock transport

The **Transport** selector in the sidebar switches the SDK's injectable `fetch`:

| Scenario | What it tests |
|----------|--------------|
| Real API | Normal operation |
| 401 / 403 / 404 | `OctaAuthenticationError`, `OctaPermissionError`, `OctaNotFoundError` |
| 429 | `OctaRateLimitError` with `retryAfter` |
| 500 | `OctaServerError` |
| Slow (3s) | Loading/skeleton states, abort mid-request |
| Timeout | `OctaTimeoutError` via SDK's built-in `timeoutMs` |
| Network Error | `OctaNetworkError` (TypeError: Failed to fetch) |

No API key needed for mock scenarios — change the transport and use `/diagnostics` to inspect error classes.

## Isolation from production bundles

- `"private": true` — never published to npm
- SDK packages have `"files": ["dist"]` — this app is never included
- Root `pnpm build` / `pnpm test` use `--filter './packages/*'` — playground is excluded from CI
