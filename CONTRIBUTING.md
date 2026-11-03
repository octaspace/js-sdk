# Contributing to @octaspace/sdk

## Prerequisites

- Node.js 22.18+ (24 LTS recommended) — the dev toolchain (Vitest 5, tsup 9) needs it
- pnpm, pinned in `package.json` (`packageManager`); enable it with Corepack:

```bash
corepack enable pnpm
```

## Setup

```bash
git clone https://github.com/octaspace/js-sdk.git
cd js-sdk
pnpm install
```

`pnpm-workspace.yaml` hardens installs: only releases older than 3 days are installed
(`minimumReleaseAge`), and only `esbuild` may run install scripts (`allowBuilds`). If a new
dependency needs a build script, add it to `allowBuilds` deliberately.

## Repository layout

This is a pnpm workspace monorepo.

```
packages/
  sdk/               # @octaspace/sdk — the core SDK package
    src/             # Source code
    tests/unit/      # Unit tests (one file per resource)
    scripts/         # Live smoke test against the real API
  sdk-query/         # @octaspace/sdk-query — TanStack Query wrappers
  sdk-react/         # @octaspace/sdk-react — React hooks & context
.changeset/          # Changesets for versioning
```

## Development workflow

Run from the repo root:

```bash
pnpm build           # Compile all packages
pnpm typecheck       # TypeScript — zero errors expected
pnpm lint            # Biome — zero issues expected
pnpm test            # Vitest — all tests must pass
pnpm audit           # Fails on high/critical advisories
```

Run all checks at once before opening a PR:

```bash
pnpm check
```

## Adding or updating a resource

1. Update or add types in `packages/sdk/src/types/`
2. Implement the resource in `packages/sdk/src/resources/`
3. Register it in `OctaClient` (`packages/sdk/src/client.ts`)
4. Export public types and classes from `packages/sdk/src/index.ts`
5. Add or update unit tests in `packages/sdk/tests/unit/`
6. Update `packages/sdk/README.md` if the public API changes

## Writing tests

Tests use `vitest` and mock `fetch` at the `OctaClient` constructor level.

```ts
import { expect, it, vi } from 'vitest'
import { loadFixture, makeClient, makeResponse, sentRequest } from './helpers.js'

it('example', async () => {
  const fixture = loadFixture('account_balance.json') // recorded next API response
  const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse(fixture))
  const client = makeClient(mockFetch) // key octa_ak_test, retries disabled

  const balance = await client.accounts.balance()
  expect(balance).toEqual(fixture)
  expect(sentRequest(mockFetch).headers.get('Authorization')).toBe('Bearer octa_ak_test')
})
```

Never make real HTTP requests in unit tests. Fixtures in `packages/sdk/tests/fixtures/next/` are
recorded API responses with IP addresses replaced by documentation ranges; keep credentials
(`ssh.web` URLs, keys) out of them.

`pnpm smoke` runs read-only checks against the live API; set `OCTA_API_KEY` to include the
authenticated ones.

Run a single test file:

```bash
pnpm --filter @octaspace/sdk exec vitest run tests/unit/compute.test.ts
```

## Code style

The codebase uses [Biome](https://biomejs.dev/) for formatting and linting.

Key conventions:
- Single quotes for strings
- 2-space indentation
- 100-character line width
- No semicolons at end of statements
- Trailing commas in multi-line structures
- `import type` for type-only imports

Auto-fix formatting before committing:

```bash
pnpm lint:fix
```

## Versioning

This project follows [Semantic Versioning](https://semver.org/):

| Change | Version bump |
|--------|-------------|
| Bug fix, internal refactor | **patch** |
| New method, new optional param | **minor** |
| Removed/renamed public API | **major** |

## Creating a changeset

Every PR that changes published behavior must include a changeset:

```bash
pnpm changeset
```

Pick the affected packages, the bump type (patch/minor/major), and write a short description. Commit the generated `.md` file together with your changes.

## Opening a pull request

1. Create a branch and make your changes
2. Run `pnpm check`
3. Add a changeset: `pnpm changeset`
4. Open a pull request

For bug fixes, include a failing test that demonstrates the bug before your fix.
