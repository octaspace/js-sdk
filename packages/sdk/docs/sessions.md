# Sessions

[← Back to README](../README.md)

**On this page:** [Lifecycle](#lifecycle) · [List and get](#list-and-get) ·
[Wait until ready](#wait-until-ready) · [Connect](#connect) · [Logs](#logs) · [Stop](#stop) ·
[Session fields](#session-fields)

`client.sessions` works with your running sessions, both compute and render. `service` tells them
apart; narrow a session with `isComputeSession()` or `isRenderSession()`.

## Lifecycle

```text
compute.start / render.start ──► starting ──► ready ──► sessions.stop
                                    ▲           │
                                    └─ restart ─┘
```

| `status` | Meaning |
| --- | --- |
| `starting` | The container is being set up; see `progress` and `pull_percent` |
| `ready` | The session is running and can be used |

A stopped session is no longer returned by the API.

## List and get

```ts
import { OctaNotFoundError, isComputeSession } from '@octaspace/sdk'

const sessions = await client.sessions.list() // running sessions, oldest first
for (const s of sessions) {
  if (isComputeSession(s)) console.log(s.uuid, s.status, s.node_number, s.urls)
}

try {
  const session = await client.sessions.get(uuid)
} catch (err) {
  if (err instanceof OctaNotFoundError) {
    // the session has stopped, or the UUID is unknown
  }
}
```

## Wait until ready

`waitReady` polls a session until it is ready and returns it:

```ts
import { OctaSessionStoppedError } from '@octaspace/sdk'

try {
  const session = await client.sessions.waitReady(uuid, {
    timeoutMs: 10 * 60_000,
    onProgress: (s) => console.log(s.status, s.progress, s.pull_percent),
  })
} catch (err) {
  if (err instanceof OctaSessionStoppedError) {
    // the session stopped while starting, for example because SSH could not be set up
  }
}
```

| Option | Default | Effect |
| --- | --- | --- |
| `intervalMs` | `3000` | Time between checks; keep it at 2000 or more to stay within the rate limit |
| `timeoutMs` | none | Throws an `OctaTimeoutError` after this many milliseconds |
| `signal` | none | Stops waiting; the call rejects with the signal's abort reason |
| `onProgress` | none | Called with the session after each check |

After `compute.restart()` the session can still report `ready` for a moment. To see the restart
finish, wait until its status leaves `ready` first.

## Connect

When a compute session is ready, these fields tell you how to reach it:

| Field | Contains |
| --- | --- |
| `ssh.direct`, `ssh.proxy` | SSH endpoints: `host`, `port` and the `user` to log in as |
| `ssh.web` | URL of the web terminal |
| `fm` | URL of the web file manager |
| `ports` | Each exposed container port mapped to its public port on the node |
| `urls` | Each HTTP port mapped to its public URL |

The SSH fields are `null` unless SSH was turned on when the session started, and `fm` is `null`
unless the file manager was. `ssh.direct` is set only when your account has an SSH key.

> [!WARNING]
> The `ssh.web` URL contains credentials, and the file manager has no login. Do not log these
> URLs or show them in shared output.

`user` comes from the image's `USER`, so the image author controls it. Validate `user` and `host`
and pass them to `ssh` as separate arguments after `--`:

```bash
ssh -p PORT -l USER -- HOST
```

## Logs

```ts
const logs = await client.sessions.logs(uuid, { tail: 100 })
if (logs.container !== null) {
  process.stdout.write(logs.container)
}
for (const e of logs.system) {
  console.log(e.ts ? new Date(e.ts) : '', e.msg)
}
```

| Field | Contains |
| --- | --- |
| `container` | The latest container output; `tail` sets the number of lines, 1 – 1000 (200 by default). `null` when the node cannot be reached or there is no output yet. |
| `container_truncated` | `true` if the output was cut to its last 1 MiB |
| `system` | Platform events of the session, oldest first |

Logs are available for running compute sessions.

## Stop

```ts
await client.sessions.stop(uuid)
await client.sessions.waitStopped(uuid)
```

Stopping takes a few seconds, during which `get` can still return the session; after that it
throws an `OctaNotFoundError`. `waitStopped` resolves once the session is gone and takes the same
`intervalMs`, `timeoutMs` and `signal` options as `waitReady`. Stopping a session twice is safe.

> [!NOTE]
> A session stopped before its minimum rent (`min_rent_minutes`) is charged as if it ran that
> long.

## Session fields

| Field | Meaning |
| --- | --- |
| `base_price`, `storage_price`, `traffic_price` | Prices in micro-USD, fixed when the session starts |
| `charge_amount` | What the session has cost so far, in micro-USD |
| `duration` | Seconds since the start |
| `started_at` | Unix milliseconds |
| `node_hw` | The node: CPU, memory, GPUs, the rented disk in GB, network speed |

While a session is starting, its prices, `started_at` and `node_hw` are `null`.
