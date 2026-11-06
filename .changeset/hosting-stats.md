---
'@octaspace/sdk': minor
---

Hosting, GPU statistics, balance and network.

- New `client.hosting.nodes()` (the account's online nodes) and `client.hosting.setPrices(number, { base, storage, traffic, min_rent_minutes })`, which changes only the prices you set.
- New `client.stats.gpuCurrent()`, `gpuHistory()` and `gpuLocations()`, with the `gpuHistoryPoints()` and `normalizeGpuHistoryOptions()` helpers.
- **Breaking:** `client.accounts.balance()` returns `{ balance, currency, decimals }` with the balance in micro-USD, and `client.network.info()` returns `NetworkInfo`.
- **Breaking:** `client.nodes` (`list`, `get`, `downloadIdent`, `downloadLogs`, `reboot`, `updatePrices`), `accounts.get()`, `accounts.generateWallet()` and `network.get()` are removed with their types (`Node*`, `Account`, `Wallet`, `Balance`, `NetworkStats`, …). Your nodes and their prices are in `client.hosting`.
