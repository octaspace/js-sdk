# OctaSpace JS SDK — monorepo

Official JavaScript/TypeScript SDK for the [OctaSpace](https://octa.space) API.

[![CI](https://github.com/octaspace/js-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/octaspace/js-sdk/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Packages

| Package | Description |
|---|---|
| [`@octaspace/sdk`](packages/sdk) | Core SDK — Node.js 22+, browsers, edge runtimes; zero dependencies |
| [`@octaspace/sdk-query`](packages/sdk-query) | TanStack Query v5 query options and keys (any framework adapter) |
| [`@octaspace/sdk-react`](packages/sdk-react) | React context and hooks without TanStack Query |

## Quick start

```bash
npm install @octaspace/sdk
```

```ts
import { OctaClient, formatUsd } from '@octaspace/sdk'

// Public endpoints need no key
const stats = await new OctaClient().stats.gpuCurrent()

// The rest needs an account key (octa_ak_…, Cube → Profile → Credentials)
const client = new OctaClient({ apiKey: process.env.OCTA_API_KEY })
const balance = await client.accounts.balance()
const machines = await client.compute.list()
console.log(formatUsd(balance.balance), machines.length)
```

## Documentation

- Core SDK: [`packages/sdk/README.md`](packages/sdk/README.md)
- TanStack Query integration: [`packages/sdk-query/README.md`](packages/sdk-query/README.md)
- React hooks/context: [`packages/sdk-react/README.md`](packages/sdk-react/README.md)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
