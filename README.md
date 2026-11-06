# OctaSpace JavaScript SDK

[![CI](https://github.com/octaspace/js-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/octaspace/js-sdk/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@octaspace/sdk)](https://www.npmjs.com/package/@octaspace/sdk)

The official JavaScript and TypeScript libraries for the [OctaSpace](https://octa.space) API. Rent
compute machines and render nodes, manage sessions and the nodes you host, and read GPU market
statistics from your code.

**Contents:** [Packages](#packages) · [Quick start](#quick-start) ·
[Documentation](#documentation) · [Versioning](#versioning) · [License](#license)

## Packages

| Package | Use it for |
| --- | --- |
| [`@octaspace/sdk`](packages/sdk/README.md) | The API client: Node.js 22 or later, browsers, Deno and Bun; no dependencies |
| [`@octaspace/sdk-query`](packages/sdk-query/README.md) | Query options and keys for TanStack Query v5, with any framework adapter |
| [`@octaspace/sdk-react`](packages/sdk-react/README.md) | React context and hooks, for apps without TanStack Query |

## Quick start

1. [Create an API key](packages/sdk/README.md#authentication) and export it:

   ```bash
   export OCTA_API_KEY="octa_ak_..."
   ```

2. Install the SDK:

   ```bash
   npm install @octaspace/sdk
   ```

3. Save this program as `quickstart.mjs` and run it with `node quickstart.mjs`:

   ```js
   import { OctaClient, formatUsd } from '@octaspace/sdk'

   const client = new OctaClient({ apiKey: process.env.OCTA_API_KEY })

   const { balance } = await client.accounts.balance()
   console.log('Balance:', formatUsd(balance)) // Balance: $12.500000

   const machines = await client.compute.list()
   console.log(machines.length, 'machines for rent')
   ```

## Documentation

| Guide | Covers |
| --- | --- |
| [`@octaspace/sdk` README](packages/sdk/README.md) | Installation, authentication, handling errors, API overview |
| [Client configuration](packages/sdk/docs/configuration.md) | Options and defaults, cancellation and timeouts, logging, several hosts |
| [Resources](packages/sdk/docs/resources.md) | Compute, render, hosting, balance, network and GPU statistics |
| [Sessions](packages/sdk/docs/sessions.md) | Waiting until ready, connecting, logs, stopping |
| [Errors, rate limits and retries](packages/sdk/docs/errors-and-reliability.md) | Error types, limits, automatic retries |
| [Changelog](packages/sdk/CHANGELOG.md) | Changes in each release |

To contribute, see [CONTRIBUTING.md](CONTRIBUTING.md).

## Versioning

The packages follow [Semantic Versioning](https://semver.org). Until version 1.0, a minor release
can contain breaking changes; the changelogs mark them as **Breaking**.

## License

[MIT](LICENSE)
