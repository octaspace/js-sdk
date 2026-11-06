# Resources

[← Back to README](../README.md)

**On this page:** [Conventions](#conventions) · [Compute](#compute) · [Render](#render) ·
[Hosting](#hosting) · [Accounts](#accounts) · [Network](#network) · [Stats](#stats)

Sessions have [their own guide](sessions.md).

## Conventions

| Concept | In the SDK |
| --- | --- |
| Money | An integer number of micro-USD, millionths of a US dollar (`1` = $0.000001): prices, charges, the balance. `formatUsd(250000)` returns `"$0.250000"`; `microUsdToUsd()` and `usdToMicroUsd()` convert. |
| Node | Identified by its node number, for example `7KQ4-M2XD-4`. Case, dashes and spaces are ignored. |
| Network speed | Whole Mbit/s in `net_down_mbps` / `net_up_mbps`; `0` if not measured. |
| Time | `started_at` of a session and log `ts` are Unix milliseconds; statistics timestamps are Unix seconds. |
| Optional values | Omit a field, or pass `undefined`, to leave it out of the request. `false` is sent as is. |
| Responses | Methods return the API's JSON as plain objects. Fields that the types do not list yet are still there. |

## Compute

Rent a machine and run your own container on it.

### List machines

```ts
import { formatUsd } from '@octaspace/sdk'

const machines = await client.compute.list()
for (const m of machines) {
  console.log(m.node_number, m.city, m.cpu_cores, formatUsd(m.base_price))
}
```

A `ComputeMachine` has its location, CPU, memory, disk, GPUs, network speed, reliability and
prices:

| Field | Meaning |
| --- | --- |
| `base_price` | Per hour of rent |
| `storage_price` | Per GB of disk per hour |
| `traffic_price` | Per GB of traffic |
| `min_rent_minutes` | Minimum rent, see below; `0` if none |

> [!NOTE]
> **Minimum rent.** If the node owner set a minimum rent, a session stopped sooner is charged as
> if it ran that long. It is not charged if the node fails.

The listing also works without an API key, but is then refreshed about once an hour; with a key it
is at most 10 seconds old.

### Start a session

```ts
const { uuid } = await client.compute.start({
  node_number: '7KQ4-M2XD-4',
  image: 'ubuntu:24.04',
  disk_size: 20, // GB
  entrypoint: 'sh -c',
  args: '"sleep infinity"',
  ssh: true,
})
```

`node_number` and `image` are required. Fields you leave out are not sent and take their defaults:

| Field | Meaning | Default |
| --- | --- | --- |
| `disk_size` | Disk size, GB | `1` |
| `envs` | Environment variables: up to 64, values up to 4 KiB | none |
| `ports` | TCP/UDP container ports to expose | none |
| `http_ports` | HTTP container ports to expose with a public URL, up to 10 | none |
| `entrypoint`, `args` | Replace the image's `ENTRYPOINT` and `CMD`. Nothing is expanded: use `sh -c '…'` for `$VAR`, `*` or `&&` | the image's own |
| `ssh` | Web terminal and SSH access | the application's setting, off without one |
| `fm` | Web file manager. It has no login: anyone with its URL can read the files | the application's setting, off without one |
| `startup_script` | Script run as root once the container is up; output goes to `/var/log/onstart.log` | none |
| `app` | Application UUID | none |

Pass `ssh: false` or `fm: false` to turn off SSH or the file manager that an application enables.

`start` returns as soon as the session is created, while its container is still being set up. Wait
for it with [`sessions.waitReady()`](sessions.md#wait-until-ready). A rejected request, for example
for an insufficient balance, throws an `OctaValidationError` with the reason.

### Start several sessions

```ts
const results = await client.compute.startBatch([
  { id: 'a', node_number: '7KQ4-M2XD-4', image: 'ubuntu:24.04' },
  { id: 'b', node_number: '3HW9-P6TR-8', image: 'ubuntu:24.04' },
])
for (const r of results) {
  if (r.status === 0) console.log(r.id, 'started', r.uuid)
  else console.log(r.id, 'failed:', r.reason)
}
```

Each item is checked on its own: one that fails does not stop the others. Results come in the
order of the items. An item without `id` gets its position in the array; two items with the same
`id` throw a `TypeError` before anything is sent.

### Restart a session

```ts
await client.compute.restart(uuid) // keep the parameters
```

`restart` recreates the container on the same node; the session keeps running, with the same
`uuid` and prices. Without parameters the session restarts with the parameters it was started
with. Follow the restart with `sessions.get()`.

> [!WARNING]
> Parameters you pass **replace** the session's parameters as a whole; they are not merged.
> Every field you leave out takes its default: `disk_size` becomes 1 GB, and `envs`, ports,
> `startup_script`, `ssh` and `fm` are dropped. Include everything the session needs:
>
> ```ts
> await client.compute.restart(uuid, {
>   disk_size: 20,
>   entrypoint: 'sh -c',
>   args: '"sleep infinity"',
>   ssh: true,
> })
> ```

The node, image and application cannot be changed. If the new parameters cannot be applied, the
session stops.

| Error | When |
| --- | --- |
| `OctaConflictError` | The session is already starting or restarting |
| `OctaRateLimitError` | The session was restarted too recently; wait `retryAfter` seconds. A session can be restarted once in 5 minutes and 6 times an hour |

## Render

Rent a render node.

```ts
const nodes = await client.render.list()

const { uuid } = await client.render.start({ node_number: '7KQ4-M2XD-4' })

const results = await client.render.startBatch([
  { id: 'a', node_number: '7KQ4-M2XD-4' },
  { id: 'b', node_number: '3HW9-P6TR-8' },
])
```

A `RenderMachine` is a node with an NVIDIA GPU, its Blender score and `base_price` per hour. The
node renders for your account until you stop the session.

When render is temporarily unavailable, `start` throws an `OctaServiceUnavailableError`, while
`startBatch` reports it for each item (`status: 1`).

## Hosting

The nodes you host and their prices.

```ts
const nodes = await client.hosting.nodes()
for (const n of nodes) {
  console.log(n.number, n.status, formatUsd(n.prices.base), n.uptime_percent)
}
```

`nodes` lists your nodes that are online, with their status (`idle`, `rented`, `verification`,
`benchmark`), the services they are offered for, prices, hardware, location and uptime.

### Set prices

```ts
import { usdToMicroUsd } from '@octaspace/sdk'

await client.hosting.setPrices('7KQ4-M2XD-4', {
  base: usdToMicroUsd(0.25), // $0.25 per hour
  min_rent_minutes: 15,
})
```

Only the prices you set change; at least one is required. The listings show the new prices within
a few seconds.

| Field | Meaning | Range |
| --- | --- | --- |
| `base` | Charged for every hour the node is rented | $0.0001 – $1000 |
| `storage` | Charged per hour for each GB of disk the renter allocates | $0 – $1000 |
| `traffic` | Charged for each GB of network traffic a rental uses | $0.0001 – $1000 |
| `min_rent_minutes` | Minimum rent of a compute session | 0 – 60 minutes; `0` turns it off |

Prices are integer micro-USD; a value that is not an integer throws a `TypeError` before the
request is sent. A value out of range throws an `OctaValidationError`, an unknown node an
`OctaNotFoundError`.

## Accounts

```ts
const { balance } = await client.accounts.balance()
console.log(formatUsd(balance)) // $12.500000
```

The balance already includes what running sessions have used and becomes negative when they use
more than the account has. A recent charge or deposit can take a moment to appear.

## Network

Platform statistics, updated every few minutes. No API key is needed.

```ts
const info = await client.network.info()
console.log(info.nodes.online, info.sessions.running, new Date(info.at * 1000))
```

`NetworkInfo` counts nodes, capacity, sessions, users, rendered frames and VPN relays.

## Stats

GPU market statistics. No API key is needed.

```ts
import { gpuHistoryPoints } from '@octaspace/sdk'

const market = await client.stats.gpuCurrent({ verified: 'yes' })
for (const g of market.gpus) {
  console.log(g.model, g.available, g.rented, g.available_price.p50)
}

const history = await client.stats.gpuHistory({
  gpuName: ['NVIDIA GeForce RTX 4090'],
  start: new Date(Date.now() - 7 * 24 * 3600 * 1000),
  step: 6 * 3600, // seconds
})
for (const p of gpuHistoryPoints(history['NVIDIA GeForce RTX 4090'])) {
  console.log(new Date(p.ts * 1000), p.rented, p.rentedPrice.p50)
}

const locations = await client.stats.gpuLocations()
```

| Method | Returns |
| --- | --- |
| `gpuCurrent` | Per GPU model: the number of GPUs (not nodes), how many are rented, performance, and price percentiles in micro-USD per GPU-hour. A percentile is `null` when there is no price. |
| `gpuHistory` | The same over time, by model; the last day with hourly points by default. `step` is at least 300 seconds; a range has at most 2000 points. `gpuHistoryPoints()` turns one model's history into one object per point. |
| `gpuLocations` | The number of GPUs by city and model |

`verified` selects the nodes the statistics cover: `'all'`, `'yes'` (verified only) or `'no'`.
