# Changelog

## 1.1.0

### Minor Changes

- 2967dbc: Node maintenance, HTTP proxy login and new machine fields.
  
  - New `hosting.setMaintenance(number, on)`: takes a node off rent and puts it back.
  - Every request names the calling application in the `X-OCTA-APP` header: `js-sdk` by default, or the new `app` option.
  - A ready `http_proxy` session's `config` is an `HttpProxyConfig` (`ip`, `port`, `username`, `password`) instead of a string.
  - `vpn.start()` takes `wg`, `awg`, `reality` and `http_proxy`; `v2ray` and its `protocol` are no longer offered by the API and are removed from `VpnStartParams` with the `V2RayProtocol` type.
  - `ComputeMachine` gains `os_version`, `virt`, `country_iso`, `is_wsl`, `is_hive_os` and `gpu_pt`; `GpuModelStats` gains `memory_mb`.

## 1.0.0

### Major Changes

- First stable release.

### Minor Changes

- 151ee53: Compute and render.
  
  - New `client.compute` with `list()`, `start()`, `startBatch()` and `restart()`, and `client.render` with `list()`, `start()` and `startBatch()`. Machines are identified by their node number, such as `7KQ4-M2XD-4`; prices are integer micro-USD; network speeds are `net_down_mbps` / `net_up_mbps` in Mbit/s. `start()` returns `{ uuid }`; `startBatch()` returns one result per item, and throws a `TypeError` before sending when two items have the same `id`. `restart(uuid)` keeps the session's parameters; `restart(uuid, params)` replaces all of them, so an omitted `disk_size` becomes 1 GB. Omitting `ssh` or `fm` keeps the application's setting. New helpers `formatUsd()`, `microUsdToUsd()` and `usdToMicroUsd()`.
  - **Breaking:** `client.services.mr` and `client.services.render` are removed with their types (`MrMachine`, `StartMrOptions`, …).
- 151ee53: Fixes.
  
  - A successful response whose body is not JSON, for example a captive portal page, throws an `OctaApiError` with the raw `body`. A failure or timeout while reading a response throws an `OctaNetworkError` or `OctaTimeoutError` and is retried like any network error.
  - Aborting a request also stops the wait between retries.
  - `Retry-After` with fractional seconds is honoured, and only valid HTTP dates are read as dates.
- 151ee53: Hosting, GPU statistics, balance and network.
  
  - New `client.hosting.nodes()` (the account's online nodes) and `client.hosting.setPrices(number, { base, storage, traffic, min_rent_minutes })`, which changes only the prices you set.
  - New `client.stats.gpuCurrent()`, `gpuHistory()` and `gpuLocations()`, with the `gpuHistoryPoints()` and `normalizeGpuHistoryOptions()` helpers.
  - **Breaking:** `client.accounts.balance()` returns `{ balance, currency, decimals }` with the balance in micro-USD, and `client.network.info()` returns `NetworkInfo`.
  - **Breaking:** `client.nodes` (`list`, `get`, `downloadIdent`, `downloadLogs`, `reboot`, `updatePrices`), `accounts.get()`, `accounts.generateWallet()` and `network.get()` are removed with their types (`Node*`, `Account`, `Wallet`, `Balance`, `NetworkStats`, …). Your nodes and their prices are in `client.hosting`.
- 151ee53: **Breaking:** Node.js 22 or later is required.
- ed1cbb9: One hosted node, network history and mining statistics.
  
  - New `hosting.get(number)`: one online node of the account.
  - New `network.history({ start, end, step })` and the helper `networkHistoryPoints()`; `NetworkInfo.power.gpus_rented`.
  - New `stats.mining({ role, days })`: miners, algorithms and pools of mining sessions.
  - `@octaspace/sdk-query`: `hostingQueries.node()`, `networkQueries.history()`, `statsQueries.mining()` and their keys.
  - `@octaspace/sdk-react`: `useHostingNode()`, `useNetworkHistory()`, `useMiningStats()`.
- 151ee53: Removed resources.
  
  - **Breaking:** `client.apps`, `client.idleJobs` and `client.services` (`vpn`) are removed with their types (`App`, `IdleJob`, `VpnNode`, `StartVpnOptions`, …), and no method returns a `Blob` any more. `new OctaClient()` takes no required options.
- 151ee53: Sessions.
  
  - `client.sessions` gains `get(uuid)`, `logs(uuid, { tail })`, `stop(uuid)`, `waitReady(uuid, { intervalMs, timeoutMs, signal, onProgress })` and `waitStopped(uuid)`. A session is a `ComputeSession` or `RenderSession`, told apart by `service` or with `isComputeSession()` / `isRenderSession()`. `status` is `starting` or `ready`, with `progress` and `pull_percent`; SSH access is in `ssh.direct`, `ssh.proxy` and `ssh.web`. A stopped session throws `OctaNotFoundError`, and `waitReady()` throws `OctaSessionStoppedError` when the session stops while starting. When their `signal` aborts, `waitReady()` and `waitStopped()` reject with its reason. Stopping a session twice is safe, so `stop()` is retried like a GET.
  - **Breaking:** `sessions.list()` takes no options and returns running sessions only. `client.services.session(uuid)`, `stop({ score })`, `ListSessionsOptions` and the old session types (`ServiceInfo`, `SessionPrices`, `SshAccess`, …) are removed.
- 151ee53: Authentication, errors and retries.
  
  - **Breaking:** the API key is an `octa_ak_…` key of your OctaSpace account, created under Account → Credentials → API Keys, and is sent as `Authorization: Bearer <key>`. A value that already starts with `Bearer ` is accepted. When the API refuses a key that does not start with `octa_ak_`, the error message says so.
  - **Breaking:** the default base URL is `DEFAULT_BASE_URL` (`https://api.octa.space`).
  - New `baseUrls` option: a GET request moves to the next host when one cannot be reached.
  - New errors `OctaConflictError` (409) and `OctaServiceUnavailableError` (503, a subclass of `OctaServerError`). **Breaking:** a 400 response throws `OctaValidationError`, like 422.
  - Every `OctaApiError` has `retryAfter` and `rateLimit`; `client.rateLimit` returns the rate limit state of the latest response. **Breaking:** the error constructors take `(message, status, details)`.
  - **Breaking:** GET requests are retried on network errors and on 429, 502, 503 and 504, not on 500. They honour `Retry-After` up to 60 seconds; a longer wait throws at once.
  - Responses without a body no longer fail to parse.
- 93fa47a: VPN and compute apps.
  
  - New `client.vpn` with `list()` (works without an API key) and `start({ node_number, subkind, protocol? })`. A ready VPN session is a `VpnSession` with the client's `config`; narrow it with the new `isVpnSession()`. Billed by traffic until `sessions.stop()`.
  - New `client.compute.apps()`: the official apps and, with an API key, your own. Pass an app's `uuid` as `app` to `compute.start()`.
  - `HostingNode.services` now types the per-protocol offer of a VPN node (`protocols`).
  - `@octaspace/sdk-query`: `vpnQueries.list()` / `vpnKeys`, `computeQueries.apps()` / `computeKeys.apps()`.
  - `@octaspace/sdk-react`: `useVpnMachines()` and `useComputeApps()`.

All notable changes to `@octaspace/sdk` are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] - 2026-07-06

### Added

- `http_proxy` VPN sessions: `'http_proxy'` in `VpnSubkind` and the `ProxyConfig` type.

### Changed

- `ServiceInfo.config` is typed `string | ProxyConfig`: an `http_proxy` session has a
  `{ ip, port }` object instead of a configuration string.

## [0.1.0] - 2026-07-06

### Added

- Initial release
- `OctaClient` with full resource coverage:
  - `accounts` — account details, balance, wallet generation
  - `apps` — available applications
  - `network` — network statistics (no API key needed)
  - `nodes` — list, get, pricing, reboot, binary file downloads
  - `services.mr` — Machine Rental: browse and start sessions
  - `services.render` — Render: browse and start sessions
  - `services.vpn` — VPN: browse and start sessions (WireGuard, OpenVPN, Shadowsocks, V2Ray)
  - `services.session(uuid)` — universal session lifecycle: info, logs, stop
  - `sessions` — list active and recent sessions
  - `idleJobs` — job status and auto-decoded log streaming
- Typed error hierarchy: `OctaError`, `OctaNetworkError`, `OctaTimeoutError`, `OctaApiError` and HTTP-specific subclasses
- Automatic retry with exponential backoff + full jitter for GET requests (respects `Retry-After`)
- `AbortSignal` support for per-request timeout and cancellation
- Injectable `fetch` for testing, proxying, and custom runtimes
- `onRequest` / `onResponse` hooks for logging and tracing
- Dual ESM + CJS build with TypeScript declarations
- Zero runtime dependencies

[0.1.1]: https://github.com/octaspace/js-sdk/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/octaspace/js-sdk/releases/tag/v0.1.0
