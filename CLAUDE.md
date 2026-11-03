# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository structure

This is a **pnpm workspace monorepo**.

```
js-sdk/
├── packages/
│   ├── sdk/               # @octaspace/sdk — the core SDK
│   ├── sdk-query/         # @octaspace/sdk-query — TanStack Query integration
│   └── sdk-react/         # @octaspace/sdk-react — React context + hooks
├── .changeset/            # Changesets for versioning and releases
├── .github/workflows/     # CI (ci.yml) — runs on main and next
├── docs/                  # Contributor docs (GIT_WORKFLOW_NEXT.md)
├── biome.json             # Linter/formatter config — covers packages/*
├── tsconfig.json          # Base TypeScript config — extended by each package
├── pnpm-workspace.yaml
└── package.json           # Private workspace root
```

## Branches

Work on the new ("next") OctaSpace API happens on the `next` branch. Branch from
`origin/next` and open PRs with `gh pr create --base next` — see
`docs/GIT_WORKFLOW_NEXT.md` before creating a branch or a PR.

## Toolchain

Node.js 22.18+ (24 LTS recommended) and pnpm via Corepack (`corepack enable pnpm`; version is
pinned in `packageManager`). `pnpm-workspace.yaml` enforces `minimumReleaseAge` (3 days) and an
`allowBuilds` allowlist for install scripts.

## Commands

Run from the **repo root** (operate on all packages via `-r`):

```bash
pnpm build           # Build all packages
pnpm typecheck       # TypeScript check all packages
pnpm lint            # Biome check packages/
pnpm lint:fix        # Biome auto-fix
pnpm test            # Run all unit tests
pnpm test:coverage   # Run with v8 coverage
pnpm check           # build + typecheck + lint + test in sequence (pre-PR gate)
pnpm audit           # Fail on high/critical advisories (also runs in CI)
pnpm changeset       # Describe a change and pick bump type (creates a .md in .changeset/)
pnpm version         # Assemble CHANGELOG and bump package.json versions (before publish)
```

Run from **packages/sdk** for package-specific tasks:

```bash
pnpm dev             # tsup watch mode
pnpm smoke           # Smoke tests against real API (requires OCTA_API_KEY)
```

Run a single test file:

```bash
pnpm --filter @octaspace/sdk exec vitest run tests/unit/compute.test.ts
```

Smoke tests with a real key:

```bash
pnpm smoke                                          # public suites only (no key)
OCTA_API_KEY=octa_ak_… pnpm smoke                   # all suites, read-only
OCTA_API_KEY=octa_ak_… pnpm smoke --suite compute,sessions
OCTA_API_URL=https://… pnpm smoke                   # another host (default: api-dev.octa.space)
```

## Architecture — `packages/sdk`

Targets the **next** OctaSpace API (test stand `https://api-dev.octa.space`, the default
`BASE_URL_DEV`). The source of truth for API differences is
`../go-sdk/.tmp/Next/API-NEXT-DIFF.md` (spec: `https://api-dev.octa.space/openapi.json`);
`docs/migration-next.md` is the user-facing summary. Unit-test fixtures in
`tests/fixtures/next/` are recorded live responses (IPs redacted), shared with go-sdk.

### Layer overview

```
src/client.ts            — OctaClient: public entry, composes all resources, `rateLimit` getter
src/config.ts            — OctaClientOptions, BASE_URL_DEV and other defaults
src/transport/http.ts    — HttpTransport: fetch, Bearer auth, failover, RateLimit/Retry-After parsing, error mapping
src/transport/types.ts   — RequestOptions (auth mode, idempotent), ApiResponse, RequestContext, ResponseContext
src/resources/           — One file per API resource, all extend BaseResource
src/resources/machines.ts— shared helpers: listing normalization, pickDefined (body allowlist), batch ids
src/errors/              — Typed error class hierarchy
src/types/               — Pure TypeScript types mirroring the next API schemas
src/utils/retry.ts       — Backoff with jitter; GET (and idempotent) only; Retry-After capped at 60 s
src/utils/money.ts       — formatUsd / microUsdToUsd / usdToMicroUsd
src/utils/null-strings.ts— "null" string → null (hosting, stats, listings only — never sessions)
src/index.ts             — Public exports only (never export transport/utils internals)
```

### Request lifecycle

1. `OctaClient` instantiates `HttpTransport` and passes it to every resource.
2. Resources call `this.request<T>(options)` from `BaseResource`; read methods take `RequestOverrides` (`signal`, `retries`) via `withRequestOverrides()`.
3. `HttpTransport.request()` delegates to `withRetry()`, which calls `requestWithFailover()` (GET tries each base URL on network errors).
4. Each attempt: build URL + headers (auth mode), `onRequest`, `fetch`, `onResponse`, record `RateLimit-*`, parse JSON (empty body → `undefined` for 202/204).
5. Non-2xx responses are mapped to typed error classes in `throwApiError()`.

### API Resources → Endpoints

| Resource (`client.X`) | Class | API path(s) | Auth |
|---|---|---|---|
| `accounts` | `AccountsResource` | `GET /accounts/balance` | required |
| `compute` | `ComputeResource` | `GET/POST /services/compute`, `POST /services/compute/{uuid}/restart` | list: optional |
| `render` | `RenderResource` | `GET/POST /services/render` | list: optional |
| `sessions` | `SessionsResource` | `GET /sessions`, `GET /services/{uuid}/info`, `GET /services/{uuid}/logs`, `POST /services/{uuid}/stop` | required |
| `hosting` | `HostingResource` | `GET /hosting/nodes`, `PATCH /hosting/nodes/{number}/prices` | required |
| `network` | `NetworkResource` | `GET /network` | none |
| `stats` | `StatsResource` | `GET /stats/gpu/current`, `/history`, `/locations` | none |

Not in the public next API, so not in the SDK: account profile/wallet, apps, VPN, idle jobs,
node details/ident/logs/reboot, session history. `/cube/*` service paths are never used.

### Key design rules

- **Zero runtime dependencies** — native `fetch` only (Node 22+).
- **Injectable fetch** — pass `fetch` in `OctaClientOptions` for tests, proxies, or older runtimes.
- **Auth** — `apiKey` (`octa_ak_…`) is optional at construction and sent as `Authorization: Bearer <key>`. Per request `auth: 'required' | 'optional' | 'none'`; required requests without a key fail before `fetch`.
- **Request bodies** — build them with `pickDefined()` from an allowlist: the API refuses unknown fields, and omitted `ssh`/`fm` (tri-state) differs from `false`.
- **Retry** — GET only, on network errors and 429/502/503/504; `idempotent: true` opts a POST in (only `sessions.stop`). Never retry starts or restarts (they cost money).
- **Money** — integer micro-USD everywhere; never floats in request bodies.
- **Restart** — a non-empty body replaces all session parameters (omitted `disk_size` → 1 GB); keep the JSDoc on `ComputeRestartParams` accurate.
- **Public surface** — `src/index.ts` exports `OctaClient`, `BASE_URL_DEV`, `OctaClientOptions`, error classes, all public types (`export type *`), helpers (`formatUsd`, `gpuHistoryPoints`, `isComputeSession`, …) and `RequestContext`/`ResponseContext`/`RequestOverrides`.

### Error hierarchy

```
OctaError
  OctaNetworkError
    OctaTimeoutError
  OctaApiError                     (status, message, retryAfter, rateLimit, requestId, body)
    OctaValidationError            (400, 422)
    OctaAuthenticationError        (401)
    OctaPermissionError            (403)
    OctaNotFoundError              (404)
      OctaSessionStoppedError      (waitReady: session disappeared)
    OctaConflictError              (409)
    OctaRateLimitError             (429)
    OctaServerError                (5xx)
      OctaServiceUnavailableError  (503)
```

### Testing

Unit tests live in `packages/sdk/tests/unit/` and mock `fetch` via `OctaClientOptions.fetch`. `tests/unit/helpers.ts` has `makeClient`, `makeResponse`, `makeErrorResponse`, `loadFixture`, `sentBody`, `sentRequest`. `scripts/smoke.ts` is a read-only live check. Live checks that spend money (starts, restarts, price changes) are done by hand with temporary scripts, only on sessions the check itself created, and are never committed.

### Tooling

- **Linter/formatter**: Biome 2 — single quotes, 2-space indent, 100-char line width, trailing commas, no semicolons. `*.md` is not checked.
- **Build**: tsup — entry `src/index.ts`, outputs `dist/index.js` (ESM) and `dist/index.cjs` (CJS) with `.d.ts`. TypeScript 6 (TS 7 has no compiler API for dts).
- **Package manager**: pnpm workspaces.

## Architecture — `packages/sdk-query`

TanStack Query v5 integration. Exports query key factories and `queryOptions`-wrapped query configs for all read operations. Zero-runtime-dep — only peer dep is `@octaspace/sdk`; `queryOptions` is implemented as a local identity helper compatible with any TanStack Query framework adapter.

### Structure

```
src/queryContext.ts — QueryContext + requestFrom(ctx): forwards TanStack's abort signal
src/queries/
├── accounts.ts    — accountKeys, accountQueries   (balance)
├── compute.ts     — computeKeys, computeQueries   (list)
├── hosting.ts     — hostingKeys, hostingQueries   (nodes)
├── network.ts     — networkKeys, networkQueries   (info)
├── render.ts      — renderKeys, renderQueries     (list)
├── sessions.ts    — sessionKeys, sessionQueries   (list, detail, logs)
└── stats.ts       — statsKeys, statsQueries       (gpuCurrent, gpuHistory, gpuLocations)
```

### Key design rules

- **Query key factories** (`*Keys`) are exported separately — use them for manual cache invalidation. Keys must be stable for equivalent inputs (see `statsKeys.gpuHistory`).
- **Every `queryFn` forwards the signal** via `requestFrom(ctx)`.
- **Mutations are not wrapped** — starts, restarts, `stop()`, `setPrices()`.

### Testing

Unit tests live in `packages/sdk-query/tests/unit/`. Each test verifies query keys are stable and `queryFn` calls the correct client method. `callQueryFn(opts, { signal })` from `tests/unit/helpers.ts` avoids passing a full `QueryFunctionContext`.

## Architecture — `packages/sdk-react`

React-first wrapper for apps that don't want TanStack Query. Exports `OctaProvider`, `useOctaClient()`, `useOctaRequest` and read-only hooks backed by the core SDK.

```
src/context.tsx        — React context provider + client accessor
src/useOctaRequest.ts  — shared async hook state machine (data/error/loading/fetching/refetch, refetchIntervalMs)
src/hooks.ts           — resource hooks (useComputeMachines, useSession, useHostingNodes, useGpuHistory, …)
```

- Hooks cancel in-flight requests on unmount/input change via `AbortController`.
- `refetch()` and polling keep data; changing inputs resets it. Hooks with required inputs use `whenReady()` so all options (incl. `refetchIntervalMs`) are forwarded.
- Testing uses `@testing-library/react` with `jsdom`; `react-test-renderer` is intentionally not used.

## Adding a new package (future)

1. Create `packages/<name>/` with its own `package.json`, `tsconfig.json` extending `../../tsconfig.json`, `tsup.config.ts`, `vitest.config.ts`.
2. Declare `@octaspace/sdk` as `"workspace:*"` in `devDependencies` and `"workspace:^"` in `peerDependencies`.
3. Add a changeset before publishing: `pnpm changeset`.

## Release workflow

Releases are manual — published when the team decides.

1. `pnpm changeset` — describe the change, pick bump type (patch/minor/major)
2. Commit the generated `.md` file together with your changes
3. When ready to release: `pnpm version` — bumps `package.json` versions and updates `CHANGELOG.md`
   - `sdk-query` and `sdk-react` declare the peer as `"@octaspace/sdk": "workspace:^"`; `pnpm publish` replaces it with `^<current sdk version>` (e.g. `^0.2.0`), so the range always matches the SDK released with them. Publish with pnpm, never `npm publish`, or the `workspace:` range leaks into the registry.
   - Nothing from `next` is published until the next API is in production.
4. `pnpm --filter @octaspace/sdk publish` — publish core SDK to npm
5. `pnpm --filter @octaspace/sdk-query publish` — publish TanStack Query integration to npm
6. `pnpm --filter @octaspace/sdk-react publish` — publish React integration to npm

## API reference

- Base URL: `https://api.octa.computer`
- OpenAPI spec: `https://api.octa.space/api-docs/swagger.json`
