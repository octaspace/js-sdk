# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository structure

This is a **pnpm workspace monorepo**.

```
js-sdk/
├── packages/
│   └── sdk/               # @octaspace/sdk — the published package
├── .changeset/            # Changesets for versioning and releases
├── .github/workflows/     # CI (ci.yml) and release (release.yml)
├── biome.json             # Linter/formatter config — covers packages/*
├── tsconfig.json          # Base TypeScript config — extended by each package
├── pnpm-workspace.yaml
└── package.json           # Private workspace root
```

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
pnpm --filter @octaspace/sdk exec vitest run tests/unit/nodes.test.ts
```

Smoke tests with a real key:

```bash
OCTA_API_KEY=<key> pnpm exec tsx scripts/smoke.ts          # all suites
OCTA_API_KEY=<key> pnpm exec tsx scripts/smoke.ts --suite network,account
```

## Architecture — `packages/sdk`

### Layer overview

```
src/client.ts          — OctaClient: public entry, composes all resources
src/config.ts          — OctaClientOptions, defaults, constants
src/transport/http.ts  — HttpTransport: fetch wrapper, retry, auth headers, error mapping
src/transport/types.ts — RequestOptions, ApiResponse, RequestContext, ResponseContext
src/auth/api-key.ts    — ApiKeyAuth (applyToRequest helper)
src/resources/         — One file per API resource, all extend BaseResource
src/resources/services/— MR, Render, VPN sub-resources + shared SessionResource
src/errors/            — Typed error class hierarchy
src/types/             — Pure TypeScript types mirroring API response shapes
src/utils/retry.ts     — Exponential backoff with jitter; retry is GET-only by default
src/index.ts           — Public exports only (never export transport/auth/utils internals)
```

### Request lifecycle

1. `OctaClient` instantiates `HttpTransport` and passes it to every resource.
2. Resources call `this.transport.request<T>(options)` from `BaseResource`.
3. `HttpTransport.request()` delegates to `withRetry()` (safe methods only by default).
4. Each attempt calls `executeRequest()`: builds URL + headers, fires `onRequest` hook, calls `fetch`, fires `onResponse` hook, parses body based on `responseType` (`json` | `blob` | `text`).
5. Non-2xx responses are mapped to typed error classes in `throwApiError()`.

### API Resources → Endpoints

| Resource (`client.X`) | Class | API path(s) |
|---|---|---|
| `accounts` | `AccountsResource` | `/accounts`, `/accounts/balance` |
| `apps` | `AppsResource` | `/apps` |
| `network` | `NetworkResource` | `/network` (no auth — `skipAuth: true`) |
| `nodes` | `NodesResource` | `/nodes`, `/nodes/{id}`, `/nodes/{id}/ident` (blob), `/nodes/{id}/logs` (blob), `/nodes/{id}/prices`, `/nodes/{id}/reboot` |
| `services.mr` | `MachineRentalService` | `/services/mr` |
| `services.render` | `RenderService` | `/services/render` |
| `services.vpn` | `VpnService` | `/services/vpn` |
| `services.session(uuid)` | `SessionResource` | `/services/{uuid}/info`, `/services/{uuid}/logs`, `/services/{uuid}/stop` |
| `sessions` | `SessionsResource` | `/sessions` |
| `idleJobs` | `IdleJobsResource` | `/idle_jobs/{nodeId}/{jobId}`, `/idle_jobs/{nodeId}/{jobId}/logs` (gzip+base64 decoded) |

### Key design rules

- **Zero runtime dependencies** — native `fetch` only (Node 18+).
- **Injectable fetch** — pass `fetch` in `OctaClientOptions` for tests, proxies, or older runtimes.
- **Auth** — `Authorization: <api_key>` header. Set `skipAuth: true` in `RequestOptions` for unauthenticated endpoints.
- **Retry** — only safe HTTP methods (`GET`) retry by default. Never auto-retry `POST`. Per-request override via `options.retries`.
- **Binary responses** — `responseType: 'blob'` for ident/log downloads.
- **Idle job logs** — gzip+base64 decoded inside `IdleJobsResource` using `DecompressionStream`; consumers receive a plain string.
- **Public surface** — `src/index.ts` exports only `OctaClient`, `OctaClientOptions`, all error classes, all public types, and `RequestContext`/`ResponseContext`. Internal modules are never exported.

### Error hierarchy

```
OctaError
  OctaNetworkError
    OctaTimeoutError
  OctaApiError
    OctaAuthenticationError  (401)
    OctaPermissionError      (403)
    OctaNotFoundError        (404)
    OctaValidationError      (422)
    OctaRateLimitError       (429, has retryAfter)
    OctaServerError          (5xx)
```

### Testing

Unit tests live in `packages/sdk/tests/unit/` and mock `fetch` via `OctaClientOptions.fetch`. See `tests/unit/helpers.ts` for shared utilities. Smoke tests in `scripts/` require a real API key.

### Tooling

- **Linter/formatter**: Biome — single quotes, 2-space indent, 100-char line width, trailing commas, no semicolons.
- **Build**: tsup — entry `src/index.ts`, outputs `dist/index.js` (ESM) and `dist/index.cjs` (CJS) with `.d.ts`.
- **Package manager**: pnpm workspaces.

## Adding a new package (future)

1. Create `packages/<name>/` with its own `package.json`, `tsconfig.json` extending `../../tsconfig.json`, `tsup.config.ts`, `vitest.config.ts`.
2. Declare `@octaspace/sdk` as `"@octaspace/sdk": "workspace:*"` in `devDependencies` and `peerDependencies`.
3. Add a changeset before publishing: `pnpm changeset`.

## Release workflow

Releases are manual — published when the team decides.

1. `pnpm changeset` — describe the change, pick bump type (patch/minor/major)
2. Commit the generated `.md` file together with your changes
3. When ready to release: `pnpm version` — bumps `package.json` versions and updates `CHANGELOG.md`
4. `pnpm --filter @octaspace/sdk publish` — publish to npm

## API reference

- Base URL: `https://api.octa.computer`
- OpenAPI spec: `https://api.octa.space/api-docs/swagger.json`
