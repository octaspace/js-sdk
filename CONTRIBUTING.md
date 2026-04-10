# Contributing to @octaspace/sdk

Thank you for your interest in improving the OCTA SDK.

## Prerequisites

- Node.js 18+
- pnpm 9+

## Setup

```bash
git clone https://github.com/octaspace/js-sdk.git
cd js-sdk
pnpm install
```

## Development workflow

```bash
pnpm typecheck   # TypeScript — zero errors expected
pnpm lint        # Biome — zero warnings expected
pnpm test        # Vitest — all tests must pass
pnpm build       # tsup — produces dist/
```

Run all checks at once before opening a PR:

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

## Project layout

```
src/
  client.ts          # OctaClient — public entry point
  config.ts          # OctaClientOptions and defaults
  index.ts           # Public exports only
  auth/              # Authentication strategies
  errors/            # Typed error classes
  resources/         # One file per API resource group
    services/        # MR, Render, VPN, Session
  transport/         # HTTP transport layer
  types/             # TypeScript types from the OpenAPI spec
  utils/             # Retry logic
tests/
  unit/              # One test file per resource
```

## Adding or updating a resource

1. Update or add types in `src/types/`
2. Implement the resource in `src/resources/`
3. Register it in `OctaClient` (`src/client.ts`)
4. Export public types and classes from `src/index.ts`
5. Add or update unit tests in `tests/unit/`
6. Update `README.md` if the public API changes

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

## Versioning

This project follows [Semantic Versioning](https://semver.org/):

| Change | Version bump |
|--------|-------------|
| Bug fix, internal refactor | **patch** |
| New method, new optional param | **minor** |
| Removed/renamed public API | **major** |

## Releasing

Releases are managed via [Changesets](https://github.com/changesets/changesets).

```bash
# 1. Describe your change
pnpm changeset

# 2. Pick the bump type (patch / minor / major) and write a short description

# 3. Commit the generated changeset file along with your changes
```

CI will automatically bump the version, update `CHANGELOG.md`, and publish to npm when a release PR is merged.

## Code style

The codebase uses [Biome](https://biomejs.dev/) for formatting and linting. Run `pnpm lint:fix` to auto-fix formatting issues before committing.

Key conventions:
- Single quotes for strings
- 2-space indentation
- 100-character line width
- No semicolons at end of statements
- Trailing commas in multi-line structures
- `import type` for type-only imports

## Opening a pull request

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make your changes and run the full check suite
4. Add a changeset: `pnpm changeset`
5. Open a PR against `main` with a clear description of the change

For bug fixes, please include a failing test that demonstrates the bug before your fix.
