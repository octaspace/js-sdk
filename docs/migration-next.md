# Migrating to the next API

The `next` branch of the JS SDK targets the next-generation OctaSpace API. The API changed its
endpoints, formats and access model, so this is a breaking upgrade of all three packages:
`@octaspace/sdk`, `@octaspace/sdk-query` and `@octaspace/sdk-react`. The per-package change
history is in their `CHANGELOG.md` files (assembled from `.changeset/`).

## Access

- **API keys.** The API takes account keys `octa_ak_…`, issued in Cube under Profile →
  Credentials, sent as `Authorization: Bearer <key>` (the SDK adds the scheme). Legacy account
  tokens are rejected with `401 Invalid bearer token`: issue a new key.
- **Base URL.** The default is `BASE_URL_DEV` (`https://api-dev.octa.space`), the stand of the new
  API. The legacy production hosts (`api.octa.space`, `api.octa.computer`) still serve the old
  API and do not work with this version.
- **Anonymous use.** `network`, `stats`, `compute.list()` and `render.list()` work without a key.
  With a key the machine listings are at most 10 seconds old instead of up to an hour.
- **Node.js 22+** is required (or any runtime with `fetch` and `AbortSignal`).

## `@octaspace/sdk`

| Legacy SDK | Next SDK |
|---|---|
| `client.services.mr.available()` | `client.compute.list()` → `ComputeMachine[]` |
| `client.services.mr.start(options)` | `client.compute.start(params)` → `{ uuid }`; several: `client.compute.startBatch(items)` → `BatchResult[]` |
| — | `client.compute.restart(uuid, params?)` |
| `client.services.render.available()` / `start()` | `client.render.list()` / `start({ node_number })` / `startBatch()` |
| `client.sessions.list({ recent })` | `client.sessions.list()` — running sessions only |
| `client.services.session(uuid).info()` | `client.sessions.get(uuid)` |
| `client.services.session(uuid).logs()` | `client.sessions.logs(uuid, { tail })` |
| `client.services.session(uuid).stop({ score })` | `client.sessions.stop(uuid)` |
| — | `client.sessions.waitReady(uuid)`, `client.sessions.waitStopped(uuid)` |
| `client.nodes.list()` | `client.hosting.nodes()` — the account's online nodes |
| `client.nodes.updatePrices(id, prices)` | `client.hosting.setPrices(number, prices)` |
| `client.accounts.balance()` → `{ balance }` (Wei) | `client.accounts.balance()` → `{ balance, currency, decimals }` (micro-USD) |
| `client.network.get()` → `NetworkStats` | `client.network.info()` → `NetworkInfo` |
| — | `client.stats.gpuCurrent()`, `gpuHistory()`, `gpuLocations()`, `gpuHistoryPoints()` |

### Removed

These have no counterpart in the public next API:

- `accounts.get()` and `accounts.generateWallet()` (profile and wallet). `accounts.balance()` is
  now the way to check a key.
- `client.apps` (the application catalog; an app is still passed to `compute.start()` by UUID).
- `client.nodes.get()`, `downloadIdent()`, `downloadLogs()`, `reboot()`.
- `client.services` with `vpn`, `mr`, `render` and `session(uuid)`.
- `client.idleJobs`.
- Session history (`recent`), the session `score` on stop, binary (`Blob`) responses.

### Data model

- **Nodes are identified by `node_number`**, a string such as `7KQ4-M2XD-4` (case, dashes and
  spaces are ignored by the API), not by an integer `node_id`.
- **Money is integer micro-USD** (`1` = $0.000001) everywhere: prices, charges, the balance. Use
  `formatUsd()`, `microUsdToUsd()` and `usdToMicroUsd()`. Wei, Ether and OCTA amounts and the
  `*_usd` / `total_price_*` fields are gone.
- **Prices** are `base_price` per hour, `storage_price` per GB of disk per hour and
  `traffic_price` per GB; `min_rent_minutes` is the shortest billed rent.
- **Start parameters.** `start_command` is gone: use `entrypoint` + `args`. New: `ssh`, `fm`,
  `startup_script`. `ssh` and `fm` are tri-state — leave them out to use the app's setting. Only
  the fields you set are sent.
- **Sessions** have `status` (`starting` / `ready`) instead of `is_ready`, plus `progress` and
  `pull_percent`. Compute and render sessions are told apart by `service`
  (`isComputeSession()` / `isRenderSession()`). SSH access is grouped in
  `ssh: { direct, proxy, web }`, ports in `ports`, variables in `envs`.
- **Network speed** is `net_down_mbps` / `net_up_mbps`: whole Mbit/s, 0 if not measured. The
  legacy `net_*_mbits` fields carried bytes per second; drop any `÷ 125 000` conversion.
- **Time** fields keep the API's units: `started_at` and log `ts` are Unix milliseconds,
  `NetworkInfo.at` and stats timestamps are Unix seconds, `HostingNode.online_at` is ISO 8601.

### Errors

- New `OctaConflictError` (409), `OctaServiceUnavailableError` (503, a subclass of
  `OctaServerError`) and `OctaSessionStoppedError` (from `waitReady`, a subclass of
  `OctaNotFoundError`).
- 400 is now an `OctaValidationError`, like 422.
- Every `OctaApiError` has `retryAfter` and `rateLimit`; `client.rateLimit` holds the last
  `RateLimit-*` state. The error constructors take `(message, status, details)`.
- Retries: only GET (and the idempotent `sessions.stop`), on network errors and 429/502/503/504,
  honouring `Retry-After` up to 60 s. 500 is no longer retried.

### Behaviour to know

- **Asynchronous operations.** `stop` and `restart` answer 202 and finish in the background. A
  session is gone once `sessions.get()` answers 404 — use `waitStopped()`.
- **Restart replaces all parameters.** `compute.restart(uuid)` keeps them; `restart(uuid, params)`
  resets everything you omit to fixed defaults, including `disk_size` = 1 GB. Pass the complete
  set. It is limited to once per 5 minutes (429 with `retryAfter`) and refused while the session
  is still starting (409).
- **Batches.** `startBatch()` reports each item (`status: 0` + `uuid`, or `status: 1` +
  `reason`); a failed item does not fail the call.
- **Render.** `render.start()` throws `OctaServiceUnavailableError` while render is unavailable;
  in a batch the same condition is a per-item `reason`.
- **Prices.** `hosting.setPrices()` answers 204 once stored; listings show the new prices after
  replication, usually within seconds.

## `@octaspace/sdk-query`

| Legacy | Next |
|---|---|
| `mrQueries.available` / `mrKeys` | `computeQueries.list` / `computeKeys` |
| `renderQueries.available` | `renderQueries.list` |
| `sessionQueries.list(client, { recent })` | `sessionQueries.list(client)` |
| `serviceSessionQueries.info(client, uuid)` | `sessionQueries.detail(client, uuid)` |
| `serviceSessionQueries.logs(client, uuid)` | `sessionQueries.logs(client, uuid, { tail })` |
| `nodeQueries.list` / `detail` | `hostingQueries.nodes` |
| `accountQueries.detail` | — (`accountQueries.balance` stays) |
| `networkQueries.stats` | `networkQueries.info` |
| — | `statsQueries.gpuCurrent` / `gpuHistory` / `gpuLocations` |
| `appQueries`, `vpnQueries`, `idleJobQueries`, `ListSessionsOptions` | removed |

Query keys changed accordingly (see the package README). Query functions now forward TanStack's
abort `signal`.

## `@octaspace/sdk-react`

| Legacy | Next |
|---|---|
| `useMrAvailable()` | `useComputeMachines()` |
| `useRenderAvailable()` | `useRenderMachines()` |
| `useSessions({ recent })` | `useSessions()` |
| `useServiceSessionInfo(uuid)` | `useSession(uuid)` |
| `useServiceSessionLogs(uuid)` | `useSessionLogs(uuid, { tail })` |
| `useNodes()`, `useNode(id)` | `useHostingNodes()` |
| `useNetworkStats()` | `useNetworkInfo()` |
| — | `useGpuCurrent()`, `useGpuHistory()`, `useGpuLocations()` |
| `useAccount()`, `useApps()`, `useVpnAvailable()`, `useIdleJob()`, `useIdleJobLogs()` | removed |

New in every hook: the `refetchIntervalMs` option for polling and the `fetching` flag. `refetch()`
now keeps the current data until the new response arrives. `useOctaRequest` is exported for
custom requests.
