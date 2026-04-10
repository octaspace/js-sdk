# @octaspace/sdk-query

TanStack Query v5 integration for the [OctaSpace SDK](https://github.com/octaspace/js-sdk).

[![npm version](https://img.shields.io/npm/v/@octaspace/sdk-query)](https://www.npmjs.com/package/@octaspace/sdk-query)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## Installation

```bash
npm install @octaspace/sdk @octaspace/sdk-query
# or
pnpm add @octaspace/sdk @octaspace/sdk-query
```

This package has a single peer dependency: `@octaspace/sdk`. It works with any TanStack
Query v5 framework adapter — `@tanstack/react-query`, `@tanstack/vue-query`,
`@tanstack/solid-query`, etc.

---

## Quick Start

```ts
import { OctaClient } from '@octaspace/sdk'
import { nodeQueries, sessionQueries } from '@octaspace/sdk-query'
import { useQuery } from '@tanstack/react-query'  // or vue-query, solid-query, …

const client = new OctaClient({ apiKey: process.env.OCTA_API_KEY })

// List nodes
const { data: nodes } = useQuery(nodeQueries.list(client))

// Node detail
const { data: node } = useQuery(nodeQueries.detail(client, 'node_id'))

// Active sessions
const { data: sessions } = useQuery(sessionQueries.list(client))

// Recent (finished) sessions
const { data: recent } = useQuery(sessionQueries.list(client, { recent: true }))
```

Public-only clients also work for unauthenticated queries:

```ts
const publicClient = new OctaClient({})
const { data: stats } = useQuery(networkQueries.stats(publicClient))
```

---

## Query Key Factories

All key factories are exported separately so you can use them for manual cache
invalidation without importing the full query objects.

```ts
import {
  accountKeys,
  appKeys,
  idleJobKeys,
  networkKeys,
  nodeKeys,
  mrKeys,
  renderKeys,
  vpnKeys,
  serviceSessionKeys,
  sessionKeys,
} from '@octaspace/sdk-query'

// Invalidate all node queries
queryClient.invalidateQueries({ queryKey: nodeKeys.all() })
// → ['@octaspace', 'nodes']

// Invalidate a specific node
queryClient.invalidateQueries({ queryKey: nodeKeys.detail('node_id') })
// → ['@octaspace', 'nodes', 'detail', 'node_id']

// Invalidate all session queries
queryClient.invalidateQueries({ queryKey: sessionKeys.all() })
// → ['@octaspace', 'sessions']
```

All keys are namespaced under `'@octaspace'` to prevent collisions with other
query libraries sharing the same `QueryClient`.

---

## Available Queries

| Export | `queryKey` | `queryFn` |
|---|---|---|
| `accountQueries.detail(client)` | `['@octaspace', 'accounts', 'detail']` | `client.accounts.get()` |
| `accountQueries.balance(client)` | `['@octaspace', 'accounts', 'balance']` | `client.accounts.balance()` |
| `appQueries.list(client)` | `['@octaspace', 'apps', 'list']` | `client.apps.list()` |
| `networkQueries.stats(client)` | `['@octaspace', 'network', 'stats']` | `client.network.get()` |
| `nodeQueries.list(client)` | `['@octaspace', 'nodes', 'list']` | `client.nodes.list()` |
| `nodeQueries.detail(client, id)` | `['@octaspace', 'nodes', 'detail', id]` | `client.nodes.get(id)` |
| `mrQueries.available(client)` | `['@octaspace', 'services', 'mr', 'available']` | `client.services.mr.available()` |
| `renderQueries.available(client)` | `['@octaspace', 'services', 'render', 'available']` | `client.services.render.available()` |
| `vpnQueries.available(client)` | `['@octaspace', 'services', 'vpn', 'available']` | `client.services.vpn.available()` |
| `serviceSessionQueries.info(client, uuid)` | `['@octaspace', 'services', 'session', uuid, 'info']` | `client.services.session(uuid).info()` |
| `serviceSessionQueries.logs(client, uuid)` | `['@octaspace', 'services', 'session', uuid, 'logs']` | `client.services.session(uuid).logs()` |
| `sessionQueries.list(client, options?)` | `['@octaspace', 'sessions', 'list', options]` | `client.sessions.list(options)` |
| `idleJobQueries.detail(client, nodeId, jobId)` | `['@octaspace', 'idleJobs', 'detail', nodeId, jobId]` | `client.idleJobs.get(nodeId, jobId)` |
| `idleJobQueries.logs(client, nodeId, jobId)` | `['@octaspace', 'idleJobs', 'logs', nodeId, jobId]` | `client.idleJobs.logs(nodeId, jobId)` |

### What is NOT wrapped

Mutations and binary downloads are intentionally excluded — they don't fit the
read-query pattern:

- `start()`, `stop()`, `reboot()`, `generateWallet()` → use `useMutation`
- `downloadIdent()`, `downloadLogs()` → return `Blob`, use directly

---

## Re-exported Types

`ListSessionsOptions` is re-exported so you don't need to import it from
`@octaspace/sdk` separately:

```ts
import type { ListSessionsOptions } from '@octaspace/sdk-query'
```

Read-only query functions transparently benefit from the core SDK request-overrides support.

---

## License

MIT © OctaSpace
