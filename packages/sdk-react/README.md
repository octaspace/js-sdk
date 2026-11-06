# @octaspace/sdk-react

[![npm](https://img.shields.io/npm/v/@octaspace/sdk-react)](https://www.npmjs.com/package/@octaspace/sdk-react)

React context and hooks for the [OctaSpace SDK](../sdk/README.md), for apps that do not use
TanStack Query. With TanStack Query, use [`@octaspace/sdk-query`](../sdk-query/README.md).

**Contents:** [Installation](#installation) · [Quick start](#quick-start) · [Hooks](#hooks) ·
[Provider](#provider)

## Installation

```bash
npm install @octaspace/sdk @octaspace/sdk-react react
# or
pnpm add @octaspace/sdk @octaspace/sdk-react react
```

Requires React 18 or later.

## Quick start

```tsx
import { OctaClient, formatUsd } from '@octaspace/sdk'
import { OctaProvider, useComputeMachines } from '@octaspace/sdk-react'

const client = new OctaClient({ apiKey: import.meta.env.VITE_OCTA_API_KEY })

function Machines() {
  const { data, loading, error, refetch } = useComputeMachines()

  if (loading) return <p>Loading…</p>
  if (error) return <p>{error.message}</p>

  return (
    <>
      <button onClick={refetch}>Refresh</button>
      <ul>
        {data?.map((m) => (
          <li key={m.node_number}>
            {m.node_number} — {formatUsd(m.base_price)}/h
          </li>
        ))}
      </ul>
    </>
  )
}

export function App() {
  return (
    <OctaProvider client={client}>
      <Machines />
    </OctaProvider>
  )
}
```

Create the client with the API key of your OctaSpace account, see
[Authentication](../sdk/README.md#authentication).

> [!WARNING]
> An API key in a browser bundle is visible to every user of the page. Use it there only in
> trusted internal tools; in public apps, call the API from your backend.

## Hooks

| Hook | Calls |
|---|---|
| `useBalance()` | `client.accounts.balance()` |
| `useComputeMachines()` | `client.compute.list()` |
| `useRenderMachines()` | `client.render.list()` |
| `useSessions()` | `client.sessions.list()` |
| `useSession(uuid)` | `client.sessions.get(uuid)` — skipped while `uuid` is empty |
| `useSessionLogs(uuid, { tail })` | `client.sessions.logs(uuid, { tail })` |
| `useHostingNodes()` | `client.hosting.nodes()` |
| `useNetworkInfo()` | `client.network.info()` (no API key needed) |
| `useGpuCurrent({ verified })` | `client.stats.gpuCurrent()` (no API key needed) |
| `useGpuHistory(options)` | `client.stats.gpuHistory()` (no API key needed) |
| `useGpuLocations()` | `client.stats.gpuLocations()` (no API key needed) |

Every hook takes options as its last argument and returns the same shape:

```ts
const { data, error, loading, fetching, refetch } = useSession(uuid, {
  enabled: true, // false skips the request
  initialData: undefined,
  refetchIntervalMs: 3000, // poll: the next request starts 3 s after the previous one settles
})
```

- `loading` is `true` while there is no data yet for the current inputs; `fetching` is `true`
  while any request is in flight, including background refetches.
- `refetch()` and polling keep the current data until the new response arrives; changing the
  inputs (e.g. another `uuid`) starts from scratch.
- Requests are cancelled through `AbortController` on unmount and when the inputs change.
- A stopped session yields an `OctaNotFoundError` in `error`.

### Following a starting session

```tsx
function SessionStatus({ uuid }: { uuid: string }) {
  const [ready, setReady] = useState(false)
  const { data, error } = useSession(uuid, { refetchIntervalMs: ready ? undefined : 3000 })

  useEffect(() => setReady(data?.status === 'ready'), [data?.status])

  if (error) return <p>{error.message}</p>
  return <p>{data?.status} {data?.progress} {data?.pull_percent ?? ''}</p>
}
```

### Mutations

Starting, restarting and stopping sessions and changing prices are plain SDK calls; call
`refetch()` of the affected hooks afterwards:

```tsx
const client = useOctaClient()
const sessions = useSessions()

async function stop(uuid: string) {
  await client.sessions.stop(uuid)
  await client.sessions.waitStopped(uuid)
  sessions.refetch()
}
```

### Custom requests

`useOctaRequest(request, deps, options)` is the hook all the others are built on:

```tsx
const client = useOctaClient()
const logs = useOctaRequest((request) => client.sessions.logs(uuid, { tail: 1000 }, request), [
  client,
  uuid,
])
```

## Provider

```tsx
<OctaProvider client={client}>{children}</OctaProvider>
```

`useOctaClient()` returns the `OctaClient` from context and throws outside a provider.

## Versioning

The package follows [Semantic Versioning](https://semver.org). Until version 1.0, a minor release
can contain breaking changes; the [changelog](CHANGELOG.md) marks them as **Breaking**.

## License

[MIT](LICENSE)
