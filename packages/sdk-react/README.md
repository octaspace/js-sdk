# @octaspace/sdk-react

React context and hooks for the [OctaSpace SDK](https://github.com/octaspace/js-sdk).

[![npm version](https://img.shields.io/npm/v/@octaspace/sdk-react)](https://www.npmjs.com/package/@octaspace/sdk-react)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## Installation

```bash
npm install @octaspace/sdk @octaspace/sdk-react react
# or
pnpm add @octaspace/sdk @octaspace/sdk-react react
```

Requires React 18+.

---

## Quick Start

```tsx
import { OctaClient } from '@octaspace/sdk'
import { OctaProvider, useNodes } from '@octaspace/sdk-react'

const client = new OctaClient({ apiKey: process.env.OCTA_API_KEY })

function NodeList() {
  const { data: nodes, loading, error, refetch } = useNodes()

  if (loading) return <p>Loading...</p>
  if (error) return <p>{error.message}</p>

  return (
    <div>
      <button onClick={refetch}>Refresh</button>
      <pre>{JSON.stringify(nodes, null, 2)}</pre>
    </div>
  )
}

export function App() {
  return (
    <OctaProvider client={client}>
      <NodeList />
    </OctaProvider>
  )
}
```

---

## Included Hooks

- `useAccount()`
- `useBalance()`
- `useApps()`
- `useNetworkStats()`
- `useNodes()`
- `useNode(id)`
- `useMrAvailable()`
- `useRenderAvailable()`
- `useVpnAvailable()`
- `useServiceSessionInfo(uuid)`
- `useServiceSessionLogs(uuid)`
- `useSessions(options?)`
- `useIdleJob(nodeId, jobId)`
- `useIdleJobLogs(nodeId, jobId)`

All hooks return the same shape:

```ts
{
  data,
  error,
  loading,
  refetch,
}
```

`refetch()` triggers a new request. Requests are automatically cancelled on
unmount or dependency change through `AbortController`.

Public-only clients are supported too:

```tsx
const client = new OctaClient({})

function NetworkBadge() {
  const { data } = useNetworkStats()
  return <span>{data?.market_price}</span>
}
```

---

## Provider

```tsx
import { OctaProvider } from '@octaspace/sdk-react'

<OctaProvider client={client}>{children}</OctaProvider>
```

Use `useOctaClient()` to access the raw `OctaClient` from React context.

## Testing

Package tests run with `@testing-library/react` and `jsdom`.

---

## License

MIT © OctaSpace
