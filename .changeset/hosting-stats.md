---
'@octaspace/sdk': minor
'@octaspace/sdk-query': minor
'@octaspace/sdk-react': minor
---

Hosting, GPU statistics, balance and network.

- `@octaspace/sdk`: new `client.hosting.nodes()` (the account's online nodes) and `client.hosting.setPrices(number, { base, storage, traffic, min_rent_minutes })`, which changes only the prices you set.
- `@octaspace/sdk`: new `client.stats.gpuCurrent()`, `gpuHistory()` and `gpuLocations()`, with the `gpuHistoryPoints()` and `normalizeGpuHistoryOptions()` helpers.
- `@octaspace/sdk`: **Breaking:** `client.accounts.balance()` returns `{ balance, currency, decimals }` with the balance in micro-USD, and `client.network.info()` returns `NetworkInfo`.
- `@octaspace/sdk`: **Breaking:** `client.nodes` (`list`, `get`, `downloadIdent`, `downloadLogs`, `reboot`, `updatePrices`), `accounts.get()`, `accounts.generateWallet()` and `network.get()` are removed with their types (`Node*`, `Account`, `Wallet`, `Balance`, `NetworkStats`, …). Your nodes and their prices are in `client.hosting`.
- `@octaspace/sdk-query`: new `hostingQueries.nodes`, `statsQueries.gpuCurrent`, `gpuHistory` and `gpuLocations`, `networkQueries.info` and their keys. Equal history options give equal query keys. **Breaking:** `nodeQueries` / `nodeKeys`, `accountQueries.detail` and `networkQueries.stats` are removed.
- `@octaspace/sdk-react`: new `useHostingNodes`, `useGpuCurrent`, `useGpuHistory`, `useGpuLocations` and `useNetworkInfo`. **Breaking:** `useNodes`, `useNode`, `useAccount` and `useNetworkStats` are removed.
