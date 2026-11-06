---
'@octaspace/sdk': minor
---

Compute and render.

- New `client.compute` with `list()`, `start()`, `startBatch()` and `restart()`, and `client.render` with `list()`, `start()` and `startBatch()`. Machines are identified by their node number, such as `7KQ4-M2XD-4`; prices are integer micro-USD; network speeds are `net_down_mbps` / `net_up_mbps` in Mbit/s. `start()` returns `{ uuid }`; `startBatch()` returns one result per item, and throws a `TypeError` before sending when two items have the same `id`. `restart(uuid)` keeps the session's parameters; `restart(uuid, params)` replaces all of them, so an omitted `disk_size` becomes 1 GB. Omitting `ssh` or `fm` keeps the application's setting. New helpers `formatUsd()`, `microUsdToUsd()` and `usdToMicroUsd()`.
- **Breaking:** `client.services.mr` and `client.services.render` are removed with their types (`MrMachine`, `StartMrOptions`, …).
