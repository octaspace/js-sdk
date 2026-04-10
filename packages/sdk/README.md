# @octaspace/sdk

Official JavaScript/TypeScript SDK for the [OCTA API](https://api.octa.space/api-docs).

[![npm version](https://img.shields.io/npm/v/@octaspace/sdk)](https://www.npmjs.com/package/@octaspace/sdk)
[![npm downloads](https://img.shields.io/npm/dm/@octaspace/sdk)](https://www.npmjs.com/package/@octaspace/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/node/v/@octaspace/sdk)](https://nodejs.org)

---

## Table of Contents

- [@octaspace/sdk](#octaspacesdk)
  - [Table of Contents](#table-of-contents)
  - [Installation](#installation)
  - [Quick Start](#quick-start)
  - [Authentication](#authentication)
  - [Resources](#resources)
    - [Accounts](#accounts)
    - [Network](#network)
    - [Apps](#apps)
    - [Nodes](#nodes)
    - [Services — Machine Rental](#services--machine-rental)
    - [Services — Render](#services--render)
    - [Services — VPN](#services--vpn)
    - [Session Lifecycle](#session-lifecycle)
    - [Sessions List](#sessions-list)
    - [Idle Jobs](#idle-jobs)
  - [Error Handling](#error-handling)
    - [Error Hierarchy](#error-hierarchy)
    - [Usage](#usage)
    - [Error Properties](#error-properties)
  - [Timeouts \& Cancellation](#timeouts--cancellation)
    - [Global timeout](#global-timeout)
    - [Per-request timeout](#per-request-timeout)
  - [Retries](#retries)
    - [Configuration](#configuration)
  - [Request \& Response Hooks](#request--response-hooks)
    - [OpenTelemetry example](#opentelemetry-example)
  - [Binary Responses](#binary-responses)
  - [Custom Fetch / Proxy](#custom-fetch--proxy)
    - [Testing with mocks](#testing-with-mocks)
    - [Server-side proxy (Next.js Route Handler)](#server-side-proxy-nextjs-route-handler)
  - [TypeScript](#typescript)
    - [VPN subkind and protocol types](#vpn-subkind-and-protocol-types)
  - [Browser Usage](#browser-usage)
  - [Requirements](#requirements)
  - [All Constructor Options](#all-constructor-options)
  - [License](#license)

---

## Installation

```bash
npm install @octaspace/sdk
# or
pnpm add @octaspace/sdk
# or
yarn add @octaspace/sdk
```

---

## Quick Start

```ts
import { OctaClient } from '@octaspace/sdk'

const client = new OctaClient({
  apiKey: process.env.OCTA_API_KEY,
})

// List available machines for rent
const machines = await client.services.mr.available()
console.log(`${machines.length} machines available`)

// Start a session
const { uuid } = await client.services.mr.start({
  node_id: machines[0].node_id,
  disk_size: 50,
  image: 'ubuntu:22.04',
  ports: [22],
})

// Check session status
const info = await client.services.session(uuid).info()
console.log('Session ready:', info.is_ready)
console.log('SSH:', info.ssh_direct ? `${info.ssh_direct.host}:${info.ssh_direct.port}` : '—')

// Stop when done
await client.services.session(uuid).stop({ score: 5 })
```

---

## Authentication

Authenticated API requests require an API key passed in the `Authorization` header.
The public `network.get()` endpoint works without a key. The SDK adds the header
automatically only for protected endpoints.

```ts
const client = new OctaClient({
  apiKey: 'your_api_key_here',
})
```

For public network stats only:

```ts
const client = new OctaClient({})
const stats = await client.network.get()
```

**Best practice:** load the key from an environment variable, never hardcode it.

```ts
// Node.js / server-side
const client = new OctaClient({
  apiKey: process.env.OCTA_API_KEY,
})
```

> **Browser warning:** Do not use your API key in client-side browser code — it will be visible to all users. Use a server-side proxy instead. See [Browser Usage](#browser-usage).

---

## Resources

### Accounts

```ts
// Full account details
const account = await client.accounts.get()
// account.email, account.uid, account.wallet, account.balance (Wei), account.ref_code

// Balance only (lighter request)
const { balance } = await client.accounts.balance()
console.log(`Balance: ${balance} Wei`)

// Generate a new deposit wallet address
const { address } = await client.accounts.generateWallet()
```

---

### Network

Public endpoint — no API key required.

```ts
const stats = await client.network.get()

console.log(`Market price: $${stats.market_price}`)
console.log(`Total nodes: ${stats.nodes.count}`)
console.log(`Monthly staking ROI: ${stats.mmROI}%`)
console.log(`Blockchain height: ${stats.blockchain.height}`)
```

---

### Apps

```ts
// List available pre-configured applications (Docker images)
const apps = await client.apps.list()

for (const app of apps) {
  console.log(`${app.name} (${app.category}) — ${app.image}`)
}

// Find an app by name
const stableApp = apps.find((a) => a.name === 'Stable Diffusion')
```

---

### Nodes

> This resource is for **node operators** managing their own machines.

```ts
// List your nodes
const nodes = await client.nodes.list()

// Get full info for a specific node
const node = await client.nodes.get('node_id')
console.log(`State: ${node.state}`)           // 'idle' | 'busy'
console.log(`CPU load: ${node.data.cpu_load_percent}%`)
console.log(`Location: ${node.location.city}, ${node.location.country}`)
console.log(`GPUs: ${node.data.gpus.map((g) => g.model).join(', ')}`)

// Update pricing (amounts in Wei)
await client.nodes.updatePrices('node_id', {
  base:    50_000_000_000_000_000,  // ~$0.05/hr (depends on OCTA/USD rate)
  storage:  5_000_000_000_000_000,
  traffic:  2_000_000_000_000_000,
})

// Reboot a node
await client.nodes.reboot('node_id')

// Download the node ident file (returns Blob)
const identBlob = await client.nodes.downloadIdent('node_id')

// Download node logs (returns Blob)
const logsBlob = await client.nodes.downloadLogs('node_id')
```

**Saving blobs — Node.js:**

```ts
import { writeFile } from 'node:fs/promises'

const identBlob = await client.nodes.downloadIdent('node_id')
await writeFile('node.ident', Buffer.from(await identBlob.arrayBuffer()))
```

**Saving blobs — Browser:**

```ts
const logsBlob = await client.nodes.downloadLogs('node_id')
const url = URL.createObjectURL(logsBlob)
const a = document.createElement('a')
a.href = url
a.download = 'node.log'
a.click()
URL.revokeObjectURL(url)
```

---

### Services — Machine Rental

Rent a machine to run any Docker container.

```ts
// Browse available machines
const machines = await client.services.mr.available()

// Filter by GPU availability
const gpuMachines = machines.filter((m) => m.is_has_gpu)

// Sort by price
const cheapest = machines.sort((a, b) => a.total_price_usd - b.total_price_usd)

console.log(`${machines[0].cpu_cores} cores, ${machines[0].gpus[0]?.model}`)
console.log(`Price: $${machines[0].total_price_usd.toFixed(4)}/hr`)

// Start a session with a public Docker image
const { uuid } = await client.services.mr.start({
  node_id:    machines[0].node_id,
  disk_size:  50,           // GB
  image:      'ubuntu:22.04',
  ports:      [22, 3000],   // TCP/UDP ports to expose
  http_ports: [8080],       // HTTP ports (get a public URL)
  envs:       { MY_VAR: 'hello' },
})

// Start a session with a pre-configured OCTA app
// image must match the app's own image field
const { uuid: uuid2 } = await client.services.mr.start({
  node_id:  machines[0].node_id,
  disk_size: 100,
  image:    'ubuntu:24.04',          // required — use the app's image value
  app:      'app-uuid-from-apps-list',
})
```

---

### Services — Render

Run distributed Blender / rendering workloads.

```ts
// Browse available render nodes
const renderNodes = await client.services.render.available()

// Find the node with the best Blender score
const best = renderNodes.sort((a, b) => b.blender_score - a.blender_score)[0]

console.log(`Best Blender score: ${best.blender_score}`)
console.log(`AI score: ${best.ai_score}`)

// Start a render session
const { uuid } = await client.services.render.start({
  node_id:           best.node_id,
  disk_size:         200,
  'multi-gpu-worker': true,  // one worker per GPU
  envs:              { PROJECT_ID: 'my-project' },
})
```

---

### Services — VPN

```ts
// Browse available VPN nodes
const vpnNodes = await client.services.vpn.available()

// Filter residential IPs
const residential = vpnNodes.filter((n) => n.residential)

// Find by country
const nlNode = vpnNodes.find((n) => n.country_iso === 'NL')

console.log(`Price: $${nlNode?.traffic_price_usd}/GB`)

// Start a WireGuard VPN session (default)
const { uuid } = await client.services.vpn.start({
  node_id: vpnNodes[0].node_id,
  subkind: 'wg',
})

// Start an OpenVPN session
const { uuid: uuid2 } = await client.services.vpn.start({
  node_id: vpnNodes[0].node_id,
  subkind: 'openvpn',
})

// Start a V2Ray session with vmess protocol
const { uuid: uuid3 } = await client.services.vpn.start({
  node_id:  vpnNodes[0].node_id,
  subkind:  'v2ray',
  protocol: 'vmess',  // 'trojan' | 'vmess' | 'vless'
})
```

After starting, get the VPN config from session info:

```ts
const info = await client.services.session(uuid).info()
console.log(info.config)  // WireGuard / OpenVPN config string
// Note: Swagger spec names this field `vpn_config` but the real API returns `config`
```

---

### Session Lifecycle

All service types (MR, Render, VPN) share the same session API.

```ts
const session = client.services.session('session-uuid')

// Poll until the session is ready
let info = await session.info()
while (!info.is_ready) {
  await new Promise((r) => setTimeout(r, 2000))
  info = await session.info()
}

// Session details
console.log('Public IP:', info.public_ip)
console.log('SSH direct:', info.ssh_direct ? `${info.ssh_direct.host}:${info.ssh_direct.port}` : '—')
console.log('SSH proxy:', info.ssh_proxy ? `${info.ssh_proxy.host}:${info.ssh_proxy.port}` : '—')
console.log('Web SSH:', info.ssh_web)
console.log('Web URLs:', info.urls)      // { '8080': 'https://...' }
console.log('Port map:', info.ports_matrix)  // { '22': 10022 }
console.log('Duration:', info.duration, 'seconds')
console.log('Charged:', info.charge_amount, 'Wei')  // number or string-encoded integer for large values

// Get container and system logs
const logs = await session.logs()
console.log(logs.container)
for (const entry of logs.system) {
  console.log(new Date(entry.ts).toISOString(), entry.msg)
}

// Stop the session (optionally rate it 1–5)
await session.stop({ score: 5 })
```

---

### Sessions List

```ts
// Active sessions
const active = await client.sessions.list()

// Recent (finished) sessions
const recent = await client.sessions.list({ recent: true })

for (const session of active) {
  console.log(`${session.uuid} — ${session.service} — ${session.node_id}`)
}
```

---

### Idle Jobs

```ts
// Check status of a background idle job
const job = await client.idleJobs.get('node_id', 'job_id')
console.log('Running:', job.is_up)
console.log('Uptime:', job.uptime, 'seconds')
if (!job.is_up) {
  console.error('Error:', job.error)
}

// Get job logs (SDK automatically decodes gzip+base64)
const logs = await client.idleJobs.logs('node_id', 'job_id')
console.log(logs)
```

---

## Error Handling

The SDK throws typed errors that are easy to catch specifically.

### Error Hierarchy

```text
OctaError
├── OctaNetworkError     — fetch failed (DNS, connection refused, etc.)
│   └── OctaTimeoutError — request timed out
└── OctaApiError         — server returned an error response
    ├── OctaAuthenticationError  — 401 Invalid API key
    ├── OctaPermissionError      — 403 Forbidden
    ├── OctaNotFoundError        — 404 Not Found
    ├── OctaValidationError      — 422 Unprocessable Entity
    ├── OctaRateLimitError       — 429 Too Many Requests
    └── OctaServerError          — 5xx Server Error
```

### Usage

```ts
import {
  OctaAuthenticationError,
  OctaNotFoundError,
  OctaRateLimitError,
  OctaServerError,
  OctaTimeoutError,
} from '@octaspace/sdk'

try {
  const node = await client.nodes.get('unknown_node')
} catch (err) {
  if (err instanceof OctaAuthenticationError) {
    console.error('Invalid API key')
  } else if (err instanceof OctaNotFoundError) {
    console.error('Node not found')
  } else if (err instanceof OctaRateLimitError) {
    console.warn(`Rate limited — retry after ${err.retryAfter}s`)
  } else if (err instanceof OctaServerError) {
    console.error(`Server error ${err.status}: ${err.message}`)
  } else if (err instanceof OctaTimeoutError) {
    console.error('Request timed out')
  } else {
    throw err  // re-throw unexpected errors
  }
}
```

### Error Properties

All `OctaApiError` subclasses include:

| Property    | Type                  | Description                                          |
| ----------- | --------------------- | ---------------------------------------------------- |
| `message`   | `string`              | Human-readable error message                         |
| `status`    | `number`              | HTTP status code                                     |
| `code`      | `string \| undefined` | Machine-readable error code from the API             |
| `requestId` | `string \| undefined` | Request ID for support (from `x-request-id` header)  |
| `body`      | `unknown`             | Raw response body                                    |

`OctaRateLimitError` additionally has:

| Property     | Type                  | Description                      |
| ------------ | --------------------- | -------------------------------- |
| `retryAfter` | `number \| undefined` | Seconds to wait before retrying  |

---

## Timeouts & Cancellation

### Global timeout

```ts
const client = new OctaClient({
  apiKey: process.env.OCTA_API_KEY,
  timeoutMs: 10_000,  // 10 seconds (default: 30 000)
})
```

### Per-request timeout

Use a short `timeoutMs` when constructing the client, or create a separate client instance for time-sensitive calls:

```ts
import { OctaTimeoutError } from '@octaspace/sdk'

const fastClient = new OctaClient({
  apiKey: process.env.OCTA_API_KEY,
  timeoutMs: 5_000,
})

try {
  const machines = await fastClient.services.mr.available()
} catch (err) {
  if (err instanceof OctaTimeoutError) {
    console.error('Timed out after 5s')
  }
}
```

---

## Retries

The SDK automatically retries failed **GET** requests on transient errors:

| Condition                | Retried?                      |
| ------------------------ | ----------------------------- |
| Network error            | Yes                           |
| 429 Too Many Requests    | Yes (respects `Retry-After`)  |
| 5xx Server Error         | Yes                           |
| 4xx Client Error         | No                            |
| POST / PATCH requests    | No                            |

Default: **2 retries** with exponential backoff and full jitter.

### Configuration

```ts
// Globally
const client = new OctaClient({
  apiKey: process.env.OCTA_API_KEY,
  retries: 3,  // default: 2
})

// Disable retries globally for this client
const noRetryClient = new OctaClient({ apiKey: process.env.OCTA_API_KEY, retries: 0 })
```

---

## Request & Response Hooks

Use hooks for logging, tracing, and monitoring without coupling to a specific library.

```ts
const client = new OctaClient({
  apiKey: process.env.OCTA_API_KEY,

  onRequest(ctx) {
    console.log(`→ ${ctx.method} ${ctx.url}  (attempt ${ctx.attempt + 1})`)
  },

  onResponse(ctx) {
    console.log(`← ${ctx.status} in ${ctx.durationMs}ms`)
  },
})
```

### OpenTelemetry example

```ts
import { trace } from '@opentelemetry/api'

const tracer = trace.getTracer('octa-sdk')
const spans = new WeakMap<object, ReturnType<typeof tracer.startSpan>>()

const client = new OctaClient({
  apiKey: process.env.OCTA_API_KEY,

  onRequest(ctx) {
    const span = tracer.startSpan(`octa.${ctx.method} ${ctx.url}`)
    spans.set(ctx, span)
  },

  onResponse(ctx) {
    spans.get(ctx.request)?.setAttributes({ 'http.status_code': ctx.status }).end()
  },
})
```

---

## Binary Responses

Some endpoints return binary files. The SDK returns native `Blob` objects.

```ts
// Download ident file
const ident = await client.nodes.downloadIdent('node_id')
// → Blob

// Download node logs
const logs = await client.nodes.downloadLogs('node_id')
// → Blob
```

**Save to disk (Node.js):**

```ts
import { writeFile } from 'node:fs/promises'

const blob = await client.nodes.downloadIdent('node_id')
await writeFile('node.ident', Buffer.from(await blob.arrayBuffer()))
```

**Trigger browser download:**

```ts
const blob = await client.nodes.downloadLogs('node_id')
const url = URL.createObjectURL(blob)
Object.assign(document.createElement('a'), {
  href: url,
  download: 'node.log',
}).click()
URL.revokeObjectURL(url)
```

---

## Custom Fetch / Proxy

Inject a custom `fetch` implementation for testing, proxying, or special environments.

### Testing with mocks

```ts
import { describe, it, vi, expect } from 'vitest'
import { OctaClient } from '@octaspace/sdk'

it('returns account balance', async () => {
  const mockFetch = vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ balance: 1000 }), { status: 200 }),
  )

  const client = new OctaClient({ apiKey: 'test', fetch: mockFetch })
  const { balance } = await client.accounts.balance()
  expect(balance).toBe(1000)
})
```

### Server-side proxy (Next.js Route Handler)

```ts
// app/api/octa/[...path]/route.ts
import { NextRequest } from 'next/server'

const OCTA_BASE = 'https://api.octa.computer'

export async function GET(req: NextRequest) {
  const path = req.nextUrl.pathname.replace('/api/octa', '')
  const upstream = await fetch(`${OCTA_BASE}${path}`, {
    headers: { Authorization: process.env.OCTA_API_KEY! },
  })
  return upstream
}
```

```ts
// Client-side — points to your proxy, no API key exposed
const client = new OctaClient({
  apiKey: '',          // not used through proxy
  baseUrl: '/api/octa',
  fetch: (url, init) => fetch(url, { ...init, headers: {} }),
})
```

---

## TypeScript

The SDK is written in TypeScript and ships with full type definitions. All types are exported and available for import.

```ts
import type {
  OctaClientOptions,
  MrMachine,
  ServiceInfo,
  VpnNode,
  VpnSubkind,
  NodePrices,
  RequestContext,
  ResponseContext,
} from '@octaspace/sdk'

// Type your own functions
function findCheapestGpu(machines: MrMachine[]): MrMachine | undefined {
  return machines
    .filter((m) => m.is_has_gpu)
    .sort((a, b) => a.total_price_usd - b.total_price_usd)[0]
}

// Type-safe client options
const options: OctaClientOptions = {
  apiKey: process.env.OCTA_API_KEY!,
  timeoutMs: 15_000,
  retries: 3,
  onRequest: (ctx: RequestContext) => {
    console.log(ctx.method, ctx.url)
  },
}
```

### VPN subkind and protocol types

```ts
import type { VpnSubkind, VpnProtocol } from '@octaspace/sdk'

// VpnSubkind: 'wg' | 'openvpn' | 'ss' | 'v2ray'
// VpnProtocol: 'trojan' | 'vmess' | 'vless'  (V2Ray only)
```

---

## Browser Usage

The SDK works in modern browsers — it uses only the native `fetch` API.

```html
<script type="module">
  import { OctaClient } from 'https://esm.sh/@octaspace/sdk'
  // ...
</script>
```

> **Security:** Never embed your API key in browser-side code — it will be visible to all users of your page. Use one of these patterns instead:
>
> - Proxy all requests through your own server (recommended)
> - Issue short-lived tokens scoped to specific operations
> - Only use the public `network.get()` endpoint client-side (no auth required)

---

## Requirements

| Environment        | Minimum version                   |
| ------------------ | --------------------------------- |
| Node.js            | 18.0.0                            |
| Browser            | Chrome 89, Firefox 90, Safari 15  |
| Deno               | 1.28                              |
| Bun                | 1.0                               |
| Cloudflare Workers | Supported                         |

Node.js 16 is supported by injecting a custom `fetch`:

```ts
import fetch from 'node-fetch'

const client = new OctaClient({
  apiKey: process.env.OCTA_API_KEY,
  fetch: fetch as typeof globalThis.fetch,
})
```

---

## All Constructor Options

```ts
const client = new OctaClient({
  // Required
  apiKey: string

  // Optional
  baseUrl?: string     // default: 'https://api.octa.computer'
  timeoutMs?: number   // default: 30_000 (30 seconds)
  retries?: number     // default: 2
  fetch?: typeof globalThis.fetch  // custom fetch implementation
  userAgent?: string   // custom User-Agent string

  // Hooks
  onRequest?: (ctx: RequestContext) => void | Promise<void>
  onResponse?: (ctx: ResponseContext) => void | Promise<void>
})
```

---

## License

MIT © OctaSpace
