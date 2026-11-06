# @octaspace/sdk-query

[![npm](https://img.shields.io/npm/v/@octaspace/sdk-query)](https://www.npmjs.com/package/@octaspace/sdk-query)

TanStack Query v5 integration for the [OctaSpace SDK](../sdk/README.md): query key factories and
ready `queryOptions` for every read operation of `@octaspace/sdk`.

**Contents:** [Installation](#installation) · [Quick start](#quick-start) ·
[Available queries](#available-queries) · [Query key factories](#query-key-factories) ·
[Mutations](#mutations)

## Installation

```bash
npm install @octaspace/sdk @octaspace/sdk-query
# or
pnpm add @octaspace/sdk @octaspace/sdk-query
```

The only peer dependency is `@octaspace/sdk`. It works with any TanStack Query v5 adapter:
`@tanstack/react-query`, `@tanstack/vue-query`, `@tanstack/solid-query` and others.

## Quick start

```ts
import { OctaClient } from '@octaspace/sdk'
import { computeQueries, sessionQueries, statsQueries } from '@octaspace/sdk-query'
import { useQuery } from '@tanstack/react-query' // or vue-query, solid-query, …

const client = new OctaClient({ apiKey: process.env.OCTA_API_KEY })

const { data: machines } = useQuery(computeQueries.list(client))
const { data: sessions } = useQuery(sessionQueries.list(client))

// Follow a starting session until it is ready
const { data: session } = useQuery({
  ...sessionQueries.detail(client, uuid),
  refetchInterval: (query) => (query.state.data?.status === 'ready' ? false : 3000),
})

// GPU statistics need no API key
const anonymousClient = new OctaClient()
const { data: gpus } = useQuery(statsQueries.gpuCurrent(anonymousClient, { verified: 'yes' }))
```

Create the client with the API key of your OctaSpace account, see
[Authentication](../sdk/README.md#authentication). An API key in a browser bundle is visible to
every user of the page: use it there only in trusted internal tools, and call the API from your
backend in public apps.

Every `queryFn` forwards TanStack's `signal`, so a cancelled query aborts its HTTP request.

## Available queries

| Export | `queryKey` | Calls |
|---|---|---|
| `accountQueries.balance(client)` | `['@octaspace', 'accounts', 'balance']` | `client.accounts.balance()` |
| `computeQueries.list(client)` | `['@octaspace', 'compute', 'list']` | `client.compute.list()` |
| `renderQueries.list(client)` | `['@octaspace', 'render', 'list']` | `client.render.list()` |
| `sessionQueries.list(client)` | `['@octaspace', 'sessions', 'list']` | `client.sessions.list()` |
| `sessionQueries.detail(client, uuid)` | `['@octaspace', 'sessions', 'detail', uuid]` | `client.sessions.get(uuid)` |
| `sessionQueries.logs(client, uuid, { tail })` | `['@octaspace', 'sessions', 'logs', uuid, { tail }]` | `client.sessions.logs(uuid, { tail })` |
| `hostingQueries.nodes(client)` | `['@octaspace', 'hosting', 'nodes']` | `client.hosting.nodes()` |
| `networkQueries.info(client)` | `['@octaspace', 'network', 'info']` | `client.network.info()` |
| `statsQueries.gpuCurrent(client, { verified })` | `['@octaspace', 'stats', 'gpu', 'current', { verified }]` | `client.stats.gpuCurrent()` |
| `statsQueries.gpuHistory(client, options)` | `['@octaspace', 'stats', 'gpu', 'history', options]` | `client.stats.gpuHistory()` |
| `statsQueries.gpuLocations(client)` | `['@octaspace', 'stats', 'gpu', 'locations']` | `client.stats.gpuLocations()` |

## Query key factories

The `*Keys` factories are exported separately for cache invalidation. All keys are namespaced
under `'@octaspace'`.

```ts
import { hostingKeys, sessionKeys } from '@octaspace/sdk-query'

queryClient.invalidateQueries({ queryKey: sessionKeys.all() }) // ['@octaspace', 'sessions']
queryClient.invalidateQueries({ queryKey: sessionKeys.detail(uuid) })
queryClient.invalidateQueries({ queryKey: hostingKeys.all() })
```

## Mutations

Operations that change state are not wrapped — call the SDK from `useMutation` and invalidate
the affected keys:

```ts
const stop = useMutation({
  mutationFn: (uuid: string) => client.sessions.stop(uuid),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: sessionKeys.all() }),
})
```

| Mutation | Invalidate |
|---|---|
| `client.compute.start()` / `startBatch()` / `restart()`, `client.render.start()` / `startBatch()`, `client.sessions.stop()` | `sessionKeys.all()` |
| `client.hosting.setPrices()` | `hostingKeys.all()`, `computeKeys.all()` (new prices appear within a few seconds) |

Starts and restarts cost money and are never retried by the SDK; keep TanStack's mutation
`retry` at its default `0` for them.

## Versioning

The package follows [Semantic Versioning](https://semver.org). Until version 1.0, a minor release
can contain breaking changes; the [changelog](CHANGELOG.md) marks them as **Breaking**.

## License

[MIT](LICENSE)
