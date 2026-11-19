---
'@octaspace/sdk': minor
'@octaspace/sdk-query': minor
'@octaspace/sdk-react': minor
---

Volumes, one hosted node, network history and mining statistics.

- `compute.start()`, `startBatch()` and `restart()` take `volume: { id, mount? }` to mount a persistent volume; a compute session reports it as `volume`.
- New `hosting.get(number)`: one online node of the account.
- New `network.history({ start, end, step })` and the helper `networkHistoryPoints()`; `NetworkInfo.power.gpus_rented`.
- New `stats.mining({ role, days })`: miners, algorithms and pools of mining sessions.
- `@octaspace/sdk-query`: `hostingQueries.node()`, `networkQueries.history()`, `statsQueries.mining()` and their keys.
- `@octaspace/sdk-react`: `useHostingNode()`, `useNetworkHistory()`, `useMiningStats()`.
