# Contributing to @octaspace/sdk

## Prerequisites

- Node.js 18+
- pnpm 9+

## Setup

```bash
git clone https://github.com/octaspace/js-sdk.git
cd js-sdk
pnpm install
```

## Repository layout

This is a pnpm workspace monorepo.

```
apps/
  playground/        # Dummy application to test SDK and UI components
packages/
  sdk/               # @octaspace/sdk — the core SDK package
    src/             # Source code
    tests/unit/      # Unit tests (one file per resource)
    scripts/         # Development scripts (smoke tests, inspection)
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
import { describe, it, vi, expect } from 'vitest'
import { OctaClient } from '../../src/client.js'

it('example', async () => {
  const mockFetch = vi.fn().mockResolvedValueOnce(
    new Response(JSON.stringify({ balance: 42 }), { status: 200 }),
  )
  const client = new OctaClient({ apiKey: 'test', fetch: mockFetch, retries: 0 })
  const result = await client.accounts.balance()
  expect(result.balance).toBe(42)
})
```

Never make real HTTP requests in unit tests.

Run a single test file:

```bash
pnpm --filter @octaspace/sdk exec vitest run tests/unit/nodes.test.ts
```

## Testing in Playground (Dummy App)

We have a dedicated playground app located in `apps/playground` to visually test SDK functions, hooks, and responses, isolated from the production bundle. 

1. Start the playground app from the repository root:
```bash
pnpm --filter playground dev
```
2. Open `http://localhost:5173` (or the URL Vite provides).
3. Set your API Key in the UI sidebar to test authenticated routes.
You can freely inspect raw responses, simulate loading states, or mutate data.

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

## Publishing a release

Releases are published manually when the team agrees on a release.

```bash
# 1. Bump versions and generate CHANGELOG from accumulated changesets
pnpm version

# 2. Review the version changes, then publish all updated packages safely:
pnpm publish -r --access public
```

## Opening a pull request

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make your changes and run the full check suite
4. Add a changeset: `pnpm changeset`
5. Open a PR against `main` with a clear description of the change

For bug fixes, include a failing test that demonstrates the bug before your fix.
