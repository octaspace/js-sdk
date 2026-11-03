# Testing the SDK from the console

How to try `@octaspace/sdk` by hand against the live next API, in addition to the unit tests
(`pnpm test`, which never touch the network).

## Setup (once)

```bash
cd js-sdk
nvm use 24                  # Node.js 22.18+ is required
corepack enable pnpm
git switch next && git pull
pnpm install
pnpm build                  # builds packages/*/dist
export OCTA_API_KEY=octa_ak_…   # account key from Cube → Profile → Credentials
```

Without `OCTA_API_KEY` only the public methods work: `network`, `stats`, `compute.list()` and
`render.list()`. The default host is the next API test stand `https://api-dev.octa.space`; set
`OCTA_API_URL` to use another one (the smoke test reads it; in your own code pass `baseUrl`).

## 1. Smoke test (read-only)

```bash
pnpm smoke                                 # all 9 checks; without a key the 3 private ones are skipped
pnpm smoke --suite compute,sessions        # only some suites
```

Suites: `network`, `stats`, `compute`, `render`, `account`, `sessions`, `hosting`. The smoke test
starts no session and changes no price.

## 2. A one-liner

```bash
node --input-type=module -e "
import { OctaClient, formatUsd } from './packages/sdk/dist/index.js'
const c = new OctaClient({ apiKey: process.env.OCTA_API_KEY })
console.log((await c.network.info()).nodes)
console.log(formatUsd((await c.accounts.balance()).balance))
console.log((await c.compute.list()).map(m => m.node_number + ' ' + formatUsd(m.base_price) + '/h'))
"
```

## 3. Interactive (REPL)

```bash
node
```

```js
const sdk = await import('./packages/sdk/dist/index.js')
const c = new sdk.OctaClient({ apiKey: process.env.OCTA_API_KEY })

await c.sessions.list()
await c.hosting.nodes()
await c.stats.gpuCurrent()
c.rateLimit // RateLimit-* values of the last response
```

### A full session cycle (costs money)

```js
const { uuid } = await c.compute.start({
  node_number: 'M95S-WZG8-7', // test node at $0.0001 per hour, no minimum rent
  image: 'alpine:3.20',
  entrypoint: 'sh -c',
  args: "'echo hi; sleep infinity'",
})
await c.sessions.waitReady(uuid, { onProgress: (s) => console.log(s.status, s.progress) })
await c.sessions.logs(uuid, { tail: 10 })
await c.sessions.stop(uuid)
await c.sessions.waitStopped(uuid)
```

Rules for checks on a live account:

- Restart and stop only sessions the check itself created, and always by their full `uuid`. A
  restart with parameters replaces all of the session's parameters, and a stopped session cannot
  be brought back.
- Check `min_rent_minutes` of the node first: a session stopped sooner is charged for that long.
- Restore any price you change with `hosting.setPrices()`.
- Do not paste `ssh.web` URLs into shared logs: they contain credentials.

## Testing changes to the source

`dist` only changes after `pnpm build`, so rebuild after editing `src`. To skip the build, import
the sources and run the file with `tsx`:

```ts
// packages/sdk/scripts/try.ts — a scratch file, do not commit it
import { OctaClient } from '../src/index.js'

const c = new OctaClient({ apiKey: process.env.OCTA_API_KEY })
console.log(await c.compute.list())
```

```bash
pnpm --filter @octaspace/sdk exec tsx scripts/try.ts
```

To test a branch that is not merged yet: `git switch <branch>`, then `pnpm install` and
`pnpm build` again.
