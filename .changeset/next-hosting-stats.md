---
'@octaspace/sdk': minor
'@octaspace/sdk-query': minor
'@octaspace/sdk-react': minor
---

Hosting, GPU statistics, balance and network on the next API.

- `@octaspace/sdk`:
  - `client.hosting.nodes()` (`GET /hosting/nodes`, online nodes of the account) and `client.hosting.setPrices(number, { base, storage, traffic, min_rent_minutes })` (`PATCH`, 204; integer micro-USD, only the fields that are set).
  - `client.stats.gpuCurrent({ verified })`, `gpuHistory({ gpuName, verified, start, end, step })`, `gpuLocations()` and the `gpuHistoryPoints()` helper.
  - `client.accounts.balance()` returns `{ balance, currency, decimals }` in micro-USD.
  - `client.network.info()` returns the new `NetworkInfo`.
  - `"null"` strings in hosting and statistics responses become `null`.
  - **Removed:** `client.nodes` (`list`, `get`, `downloadIdent`, `downloadLogs`, `reboot`, `updatePrices`), `accounts.get()`, `accounts.generateWallet()`, `network.get()` and their types (`Node*`, `Account`, `Wallet`, `Balance`, `NetworkStats`, …).
- `@octaspace/sdk-query`: `hostingQueries.nodes`, `statsQueries.gpuCurrent|gpuHistory|gpuLocations`, `networkQueries.info` and their keys; all queries forward the abort signal. **Removed:** `nodeQueries`/`nodeKeys`, `accountQueries.detail`, `networkQueries.stats`.
- `@octaspace/sdk-react`: `useHostingNodes`, `useGpuCurrent`, `useGpuHistory`, `useGpuLocations`, `useNetworkInfo`. **Removed:** `useNodes`, `useNode`, `useAccount`, `useNetworkStats`.
