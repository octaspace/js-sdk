# @octaspace/sdk

Typed JavaScript/TypeScript client for the [OctaSpace](https://octa.space) API:
rent compute machines and render nodes, follow running sessions, manage the nodes you host and
their prices, read the account balance and public network and GPU market statistics.

- Zero runtime dependencies, native `fetch` — Node.js 22+, browsers, Deno, Bun, edge runtimes.
- ESM and CommonJS builds with full type definitions.
- Typed errors, rate-limit awareness, retries for safe requests, abort signals, host failover.

## Installation

```bash
npm install @octaspace/sdk
# or
pnpm add @octaspace/sdk
```

## Quick start

```ts
import { OctaClient, formatUsd } from '@octaspace/sdk'

// Public endpoints need no key
const publicClient = new OctaClient()
const network = await publicClient.network.info()
console.log(`${network.nodes.online} nodes online`)

// Everything else needs an account key (octa_ak_…, Cube → Profile → Credentials)
const client = new OctaClient({ apiKey: process.env.OCTA_API_KEY })

const balance = await client.accounts.balance()
console.log(formatUsd(balance.balance)) // "$12.500000"

const [machine] = await client.compute.list()
const { uuid } = await client.compute.start({
  node_number: machine.node_number,
  image: 'ubuntu:24.04',
  disk_size: 20,
  ssh: true,
})

const session = await client.sessions.waitReady(uuid, {
  onProgress: (s) => console.log(s.status, s.progress, s.pull_percent),
})
// … use it …
await client.sessions.stop(uuid)
await client.sessions.waitStopped(uuid)
```

## Client options

```ts
const client = new OctaClient({
  apiKey: process.env.OCTA_API_KEY, // optional; sent as "Authorization: Bearer <key>"
  baseUrl: 'https://api-dev.octa.space', // default: BASE_URL_DEV
  baseUrls: ['https://a.example', 'https://b.example'], // GET failover on network errors
  timeoutMs: 30_000, // per request
  retries: 2, // automatic retries of safe requests
  userAgent: 'my-app/1.0',
  fetch: customFetch, // tests, proxies
  onRequest: (ctx) => {}, // method, url, headers, body, attempt
  onResponse: (ctx) => {}, // request, status, headers, durationMs
})
```

Every method that reads data also takes request overrides as its last argument:
`{ signal?: AbortSignal, retries?: number }`.

## Resources

| Resource | Methods | API |
|---|---|---|
| `client.compute` | `list()`, `start(params)`, `startBatch(items)`, `restart(uuid, params?)` | `/services/compute` |
| `client.render` | `list()`, `start({ node_number })`, `startBatch(items)` | `/services/render` |
| `client.sessions` | `list()`, `get(uuid)`, `logs(uuid, { tail })`, `stop(uuid)`, `waitReady(uuid)`, `waitStopped(uuid)` | `/sessions`, `/services/{uuid}/…` |
| `client.hosting` | `nodes()`, `setPrices(number, prices)` | `/hosting/nodes` |
| `client.accounts` | `balance()` | `/accounts/balance` |
| `client.network` | `info()` (public) | `/network` |
| `client.stats` | `gpuCurrent()`, `gpuHistory()`, `gpuLocations()` (public) | `/stats/gpu/*` |

`compute.list()` and `render.list()` work without a key too, but the anonymous listing is cached
for up to an hour; with a key it is at most 10 seconds old.

### Compute

```ts
// One session: an object → 201 { uuid }; errors throw (e.g. OctaValidationError "Insufficient balance")
const { uuid } = await client.compute.start({
  node_number: '7KQ4-M2XD-4', // case, dashes and spaces are ignored by the API
  image: 'vllm/vllm-openai:latest',
  disk_size: 50, // GB, default 1
  envs: { HF_TOKEN: '…' },
  ports: [9000], // TCP/UDP
  http_ports: [8000], // public URLs in session.urls
  entrypoint: 'python3 -m vllm.entrypoints.openai.api_server',
  args: '--model meta-llama/Llama-3.1-8B-Instruct',
  ssh: true, // web terminal + SSH; omitted = the app's setting
  fm: false, // web file manager (no login!); omitted = the app's setting
  startup_script: 'apt-get update && apt-get install -y htop',
})

// Several sessions: an array → 200, one result per item, in order; a failed item does not fail the batch
const results = await client.compute.startBatch([
  { id: 'a', node_number: '7KQ4-M2XD-4', image: 'alpine' },
  { node_number: '9ZRT-3HKP-1', image: 'alpine' }, // id defaults to the position
])
for (const r of results) {
  if (r.status === 0) console.log(r.id, 'started', r.uuid)
  else console.log(r.id, 'failed:', r.reason)
}
```

Starts and restarts are never retried automatically: they cost money.

#### Restart

```ts
await client.compute.restart(uuid) // same container parameters
```

`restart(uuid, params)` **replaces all parameters** of the session. Every field you leave out gets
a fixed default, not the session's current value. In particular `disk_size` becomes **1 GB**, and
`envs`, ports, `startup_script`, `ssh` and `fm` are dropped. The session info does not report
`entrypoint`, `args`, `startup_script` or `disk_size`, so always pass the complete set:

```ts
await client.compute.restart(uuid, {
  disk_size: 50,
  envs: { HF_TOKEN: '…' },
  http_ports: [8000],
  entrypoint: 'python3 -m vllm.entrypoints.openai.api_server',
  args: '--model meta-llama/Llama-3.1-8B-Instruct --max-model-len 8192',
  ssh: true,
})
```

A restart answers 202 and runs in the background; follow it with `sessions.get()`. While the
session is still starting or restarting the API refuses with `OctaConflictError` (409); a session
can be restarted once per 5 minutes and 6 times per hour, otherwise `OctaRateLimitError` (429)
with `retryAfter` in seconds.

### Sessions

Only running sessions exist in the API. Once a session stops, `get`, `logs` and `stop` answer 404
(`OctaNotFoundError`), and there is no session history.

```ts
import { isComputeSession } from '@octaspace/sdk'

for (const s of await client.sessions.list()) {
  if (isComputeSession(s)) {
    console.log(s.uuid, s.status, s.node_number, s.urls, s.ssh?.proxy)
  }
}

const logs = await client.sessions.logs(uuid, { tail: 100 }) // compute sessions only
console.log(logs.system.map((e) => e.msg), logs.container)

const ready = await client.sessions.waitReady(uuid, { intervalMs: 3000, timeoutMs: 300_000 })
```

`waitReady` throws `OctaSessionStoppedError` (a subclass of `OctaNotFoundError`) when the session
stops while starting, for example because its SSH setup failed.

- `ssh.web` contains credentials in the URL — do not log it.
- `ssh.*.user` comes from the image's `USER`: validate `user` and `host` and pass them as separate
  arguments after `--` (`ssh -p PORT -l USER -- HOST`).
- `stop()` is idempotent (repeating it is harmless). A session stopped before
  `min_rent_minutes` is charged base and storage for that long.

### Render

```ts
const nodes = await client.render.list()
const { uuid } = await client.render.start({ node_number: nodes[0].node_number })
```

A render node is billed by the hour until stopped. When render is temporarily unavailable,
`start` throws `OctaServiceUnavailableError` (503), while `startBatch` reports it per item
(`status: 1`, `reason: "Service is temporarily unavailable"`).

### Hosting

```ts
import { usdToMicroUsd } from '@octaspace/sdk'

for (const node of await client.hosting.nodes()) {
  console.log(node.number, node.status, node.prices, node.services)
}

await client.hosting.setPrices('7KQ4-M2XD-4', {
  base: usdToMicroUsd(0.25), // per hour
  min_rent_minutes: 15,
})
```

`hosting.nodes()` lists online nodes only. `setPrices` sends only the fields you set; it answers
204 once the prices are stored, and listings show them after replication, usually within seconds.

### Statistics (public)

```ts
import { gpuHistoryPoints } from '@octaspace/sdk'

const current = await publicClient.stats.gpuCurrent({ verified: 'yes' })
const history = await publicClient.stats.gpuHistory({
  gpuName: ['NVIDIA GeForce RTX 4090'],
  start: new Date(Date.now() - 7 * 86_400_000),
  step: 3600,
})
const points = gpuHistoryPoints(history['NVIDIA GeForce RTX 4090'])
const locations = await publicClient.stats.gpuLocations()
```

## Data conventions

- **Node numbers** (`node_number`, `HostingNode.number`) are strings like `7KQ4-M2XD-4`.
- **Money** is integer **micro-USD** everywhere (`1` = $0.000001): prices, charges, the balance.
  Use `formatUsd(amount)` (`"$0.000100"`), `microUsdToUsd()` and `usdToMicroUsd()`. The balance is
  `balance / 10 ** decimals` — read `decimals` from the response — and can be negative.
- **Prices**: `base_price` per hour, `storage_price` per GB of disk per hour, `traffic_price` per
  GB of traffic; `min_rent_minutes` is the shortest billed rent (0 = none).
- **Network speed** `net_down_mbps` / `net_up_mbps` is whole Mbit/s (0 = not measured).
- **Time** keeps the API's units: `started_at` and log `ts` are Unix **milliseconds**;
  `NetworkInfo.at`, stats timestamps and `activity.started_at` are Unix **seconds**;
  `HostingNode.online_at` is an ISO 8601 string.
- **Raw data.** Methods return the parsed JSON as is: fields the SDK does not type yet are still
  there. The only change is that hosting, stats and listings turn the string `"null"` some nodes
  report into `null`.

## Errors

```
OctaError
├── OctaNetworkError                DNS, connection, aborted request
│   └── OctaTimeoutError            request timeout, or waitReady/waitStopped timeoutMs
└── OctaApiError                    HTTP 4xx/5xx: status, message, retryAfter, rateLimit, requestId, body
    ├── OctaValidationError         400, 422 — message says why
    ├── OctaAuthenticationError     401 — missing or invalid key
    ├── OctaPermissionError         403
    ├── OctaNotFoundError           404 — e.g. a stopped session
    │   └── OctaSessionStoppedError waitReady: the session stopped while starting
    ├── OctaConflictError           409 — e.g. restart while restarting
    ├── OctaRateLimitError          429 — wait retryAfter seconds
    └── OctaServerError             5xx
        └── OctaServiceUnavailableError 503 — retry later
```

```ts
import { OctaRateLimitError, OctaValidationError } from '@octaspace/sdk'

try {
  await client.compute.restart(uuid)
} catch (err) {
  if (err instanceof OctaRateLimitError) console.log(`retry in ${err.retryAfter}s`)
  else if (err instanceof OctaValidationError) console.log(err.message)
  else throw err
}
```

A request that needs a key fails before it is sent when the client has none
(`OctaAuthenticationError`). When a key that does not start with `octa_ak_` is refused, the error
message says so.

## Rate limits and retries

The API allows 60 requests per minute per IP without a key, 300 per minute per account with one,
and 10 per minute for starts and restarts. `client.rateLimit` holds the `RateLimit-Limit`,
`-Remaining` and `-Reset` values of the last response.

Only GET requests are retried (and `sessions.stop`, which is idempotent): on network errors and on
429, 502, 503 and 504, with exponential backoff, honouring `Retry-After` up to 60 seconds. A longer
wait (such as the restart cooldown) is returned to you at once.

## License

MIT
