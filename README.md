# OctaSpace JS SDK — monorepo

This repository contains the official JavaScript/TypeScript SDK for the [OCTA API](https://api.octa.space/api-docs).

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Packages

| Package | Version | Description |
|---|---|---|
| [`@octaspace/sdk`](packages/sdk) | [![npm](https://img.shields.io/npm/v/@octaspace/sdk)](https://www.npmjs.com/package/@octaspace/sdk) | Core SDK — Node.js, browser, edge runtimes |
| [`@octaspace/sdk-query`](packages/sdk-query) | [![npm](https://img.shields.io/npm/v/@octaspace/sdk-query)](https://www.npmjs.com/package/@octaspace/sdk-query) | TanStack Query v5 integration (framework-agnostic) |
| [`@octaspace/sdk-react`](packages/sdk-react) | [![npm](https://img.shields.io/npm/v/@octaspace/sdk-react)](https://www.npmjs.com/package/@octaspace/sdk-react) | React context and hooks without TanStack Query |

## Quick start

```bash
npm install @octaspace/sdk
# or
pnpm add @octaspace/sdk
```

```ts
import { OctaClient } from '@octaspace/sdk'

const client = new OctaClient({ apiKey: process.env.OCTA_API_KEY })

const account = await client.accounts.get()
const nodes = await client.nodes.list()
const stats = await client.network.get()
```

Public-only usage is also supported:

```ts
const publicClient = new OctaClient({})
const stats = await publicClient.network.get()
```

## Package docs

- Core SDK: [`packages/sdk/README.md`](packages/sdk/README.md)
- TanStack Query integration: [`packages/sdk-query/README.md`](packages/sdk-query/README.md)
- React hooks/context: [`packages/sdk-react/README.md`](packages/sdk-react/README.md)

## Development

```bash
pnpm install
pnpm build
pnpm typecheck
pnpm lint
pnpm test
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full development guide.
