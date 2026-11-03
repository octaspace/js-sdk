---
'@octaspace/sdk': minor
'@octaspace/sdk-query': minor
'@octaspace/sdk-react': minor
---

Compute and render on the next API.

- `@octaspace/sdk`: new `client.compute` (`list`, `start`, `startBatch`, `restart`) and `client.render` (`list`, `start`, `startBatch`). Machines are identified by `node_number` (e.g. `7KQ4-M2XD-4`); prices are integer micro-USD; network speeds are `net_down_mbps`/`net_up_mbps` in Mbit/s. `start` sends an object and returns `{ uuid }` (201); `startBatch` sends an array and returns per-item `BatchResult[]` (200). `restart(uuid)` keeps the original parameters; `restart(uuid, params)` replaces all of them (omitted `disk_size` becomes 1 GB). `ssh`/`fm` are tri-state: omitted means the app's setting. Listings tolerate `"null"` strings in GPU fields. New helpers: `formatUsd`, `microUsdToUsd`, `usdToMicroUsd`. **Removed:** `client.services.mr` and `client.services.render` with their types (`MrMachine`, `StartMrOptions`, …).
- `@octaspace/sdk-query`: `computeQueries.list` / `computeKeys` and `renderQueries.list` / `renderKeys` (keys `['@octaspace', 'compute' | 'render', 'list']`); query functions forward TanStack's abort `signal`. **Removed:** `mrQueries`, `mrKeys` and the old `renderQueries.available`.
- `@octaspace/sdk-react`: `useComputeMachines()` and `useRenderMachines()`. **Removed:** `useMrAvailable()` and `useRenderAvailable()`.
