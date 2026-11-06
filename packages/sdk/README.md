# OctaSpace JavaScript SDK

[![CI](https://github.com/octaspace/js-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/octaspace/js-sdk/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@octaspace/sdk)](https://www.npmjs.com/package/@octaspace/sdk)

The official JavaScript and TypeScript library for the [OctaSpace](https://octa.space) API. Rent
compute machines and render nodes, manage sessions and the nodes you host, and read GPU market
statistics from your code.

**Contents:** [Installation](#installation) · [Quick start](#quick-start) ·
[Authentication](#authentication) · [Handling errors](#handling-errors) ·
[API overview](#api-overview) · [Documentation](#documentation) · [Versioning](#versioning)

## Installation

```bash
npm install @octaspace/sdk
```

Requires Node.js 22 or later. The package has no dependencies and uses the built-in `fetch`, so it
also runs in browsers, Deno and Bun. It ships ESM and CommonJS builds with type definitions.

## Quick start

1. [Create an API key](#authentication) and export it:

   ```bash
   export OCTA_API_KEY="octa_ak_..."
   ```

2. Save this program as `quickstart.mjs`:

   ```js
   import { OctaClient, OctaApiError, formatUsd } from '@octaspace/sdk'

   const client = new OctaClient({ apiKey: process.env.OCTA_API_KEY })

   try {
     const { balance } = await client.accounts.balance()
     console.log('Balance:', formatUsd(balance)) // Balance: $12.500000

     const machines = await client.compute.list()
     for (const m of machines) {
       console.log(m.node_number, m.city, formatUsd(m.base_price), 'per hour')
     }
   } catch (err) {
     if (err instanceof OctaApiError) {
       console.error(`${err.status}: ${err.message}`)
       process.exitCode = 1
     } else {
       throw err
     }
   }
   ```

3. Run it:

   ```bash
   node quickstart.mjs
   ```

Create one client and reuse it.

## Authentication

The SDK authenticates with an **API key** of your OctaSpace account. You create and delete API
keys in the OctaSpace dashboard:

1. Sign in to the [OctaSpace dashboard](https://cube-dev.octa.space).
2. In the sidebar, open **Account → Credentials**.
3. In the **API Keys** section, click **New key**.
4. Enter a **Label** that tells you where the key is used, for example `billing-service`, and
   click **Create key**.
5. Copy the key. It starts with `octa_ak_`.

> [!IMPORTANT]
> The key is shown in full only once, right after you create it. Copy it before you close the
> dialog. If you lose it, delete it and create a new one.

Pass the key as the `apiKey` option. The SDK sends it in the `Authorization: Bearer <key>` header.

```ts
const client = new OctaClient({ apiKey: process.env.OCTA_API_KEY })
```

> [!WARNING]
> An API key acts on behalf of your account: it can start sessions that are charged to your
> balance. Keep it out of source code, version control and browser bundles. If a key leaks,
> delete it under **Account → Credentials → API Keys**; every program that uses it stops working
> at once.

The **API Keys** list shows each key's label, its first characters and when it was last used. Use
a separate key for each program or machine, so that you can delete one without affecting the
others. The number of keys per account is limited; the counter next to **API Keys** shows how
many you have.

### Calls without an API key

These methods also work without an API key. Create the client without `apiKey` to use them
anonymously:

| Method | Without a key |
| --- | --- |
| `network.info` | Same result |
| `stats.gpuCurrent`, `stats.gpuHistory`, `stats.gpuLocations` | Same result |
| `compute.list`, `render.list` | Refreshed about once an hour instead of every 10 seconds |

Every other method requires an API key. Without one it throws an `OctaAuthenticationError`
before the request is sent.

## Handling errors

Every error the SDK throws is an `OctaError`. Errors returned by the API are subclasses of
`OctaApiError`; check them with `instanceof`:

```ts
import {
  OctaAuthenticationError,
  OctaRateLimitError,
  OctaValidationError,
} from '@octaspace/sdk'

try {
  await client.compute.start({ node_number: '7KQ4-M2XD-4', image: 'ubuntu:24.04' })
} catch (err) {
  if (err instanceof OctaAuthenticationError) {
    // the API key is missing, wrong or deleted
  } else if (err instanceof OctaValidationError) {
    // the request was rejected; err.message says why
  } else if (err instanceof OctaRateLimitError) {
    // too many requests; wait err.retryAfter seconds
  } else {
    throw err
  }
}
```

See [Errors, rate limits and retries](docs/errors-and-reliability.md).

## API overview

| Resource | Dashboard section | Operations | Guide |
| --- | --- | --- | --- |
| `client.compute` | Marketplace → Compute | List machines, start, batch start, restart | [Compute](docs/resources.md#compute) |
| `client.render` | Render → Launch Nodes | List render nodes, start, batch start | [Render](docs/resources.md#render) |
| `client.sessions` | Marketplace → Sessions, Render → Render Nodes | List, get, logs, stop, wait until ready or stopped | [Sessions](docs/sessions.md) |
| `client.hosting` | Hosting → Nodes | Your nodes, set prices | [Hosting](docs/resources.md#hosting) |
| `client.accounts` | Account → Billing | Balance | [Accounts](docs/resources.md#accounts) |
| `client.network` | — | Platform statistics | [Network](docs/resources.md#network) |
| `client.stats` | — | GPU market: current, history, locations | [Stats](docs/resources.md#stats) |

Every type and method has TSDoc comments, which your editor shows as you type.

For TanStack Query and React, see [`@octaspace/sdk-query`](../sdk-query/README.md) and
[`@octaspace/sdk-react`](../sdk-react/README.md).

## Documentation

| Guide | Covers |
| --- | --- |
| [Client configuration](docs/configuration.md) | Options and defaults, cancellation and timeouts, logging, several hosts |
| [Resources](docs/resources.md) | Compute, render, hosting, balance, network and GPU statistics |
| [Sessions](docs/sessions.md) | Waiting until ready, connecting, logs, stopping |
| [Errors, rate limits and retries](docs/errors-and-reliability.md) | Error types, limits, automatic retries |
| [Changelog](CHANGELOG.md) | Changes in each release |

## Versioning

The library follows [Semantic Versioning](https://semver.org). Until version 1.0, a minor release
can contain breaking changes; the [changelog](CHANGELOG.md) marks them as **Breaking**.

## License

[MIT](LICENSE)
