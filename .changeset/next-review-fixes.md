---
'@octaspace/sdk': minor
'@octaspace/sdk-query': patch
'@octaspace/sdk-react': patch
---

Fixes.

- `@octaspace/sdk`:
  - A 2xx response whose body is not JSON (e.g. a captive portal) throws `OctaApiError` with the raw `body`; a failure or timeout while reading a body throws `OctaNetworkError` / `OctaTimeoutError` and is retried like any network error.
  - Aborting a request now also interrupts the wait between retries (e.g. a 60 s `Retry-After`).
  - `sessions.waitReady()` / `waitStopped()` always reject with the abort reason when their signal aborts.
  - `startBatch()` throws a `TypeError` before sending when two items get the same `id` (including a clash with a default position).
  - `Retry-After` accepts fractional seconds and parses only real HTTP dates.
  - `MachineGpu.mem_total_mb`, `pcie_link_gen` and `pcie_link_width` are typed `number | null`, matching what the listings may contain.
  - New `normalizeGpuHistoryOptions()` helper.
- `@octaspace/sdk-query`: `statsKeys.gpuHistory` uses `normalizeGpuHistoryOptions()`.
- `@octaspace/sdk-react`: `initialData` is kept on mount; a hook that becomes disabled (e.g. `useSession(null)`) drops the previous data and error, and shows `loading` again when re-enabled.
