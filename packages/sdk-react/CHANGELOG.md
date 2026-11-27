# Changelog

## 1.1.0

### Patch Changes

- Updated dependencies [2967dbc]
  - @octaspace/sdk@1.1.0

## 1.0.0

### Major Changes

- First stable release.

### Minor Changes

- ed1cbb9: One hosted node, network history and mining statistics.
  
  - New `hosting.get(number)`: one online node of the account.
  - New `network.history({ start, end, step })` and the helper `networkHistoryPoints()`; `NetworkInfo.power.gpus_rented`.
  - New `stats.mining({ role, days })`: miners, algorithms and pools of mining sessions.
  - `@octaspace/sdk-query`: `hostingQueries.node()`, `networkQueries.history()`, `statsQueries.mining()` and their keys.
  - `@octaspace/sdk-react`: `useHostingNode()`, `useNetworkHistory()`, `useMiningStats()`.
- 151ee53: First release.
  
  - `@octaspace/sdk-query`: query options and key factories for TanStack Query v5 for every read operation of `@octaspace/sdk`: `accountQueries`, `computeQueries`, `renderQueries`, `sessionQueries`, `hostingQueries`, `networkQueries` and `statsQueries`, with the matching `*Keys`. Every query forwards TanStack's abort signal. Works with any TanStack Query adapter.
  - `@octaspace/sdk-react`: `OctaProvider`, `useOctaClient()` and hooks for every read operation: `useBalance`, `useComputeMachines`, `useRenderMachines`, `useSessions`, `useSession`, `useSessionLogs`, `useHostingNodes`, `useNetworkInfo`, `useGpuCurrent`, `useGpuHistory` and `useGpuLocations`, built on the exported `useOctaRequest`. Hooks take `enabled`, `initialData` and `refetchIntervalMs`, return `data`, `error`, `loading`, `fetching` and `refetch()`, and cancel their requests on unmount and when the inputs change.
- 93fa47a: VPN and compute apps.
  
  - New `client.vpn` with `list()` (works without an API key) and `start({ node_number, subkind, protocol? })`. A ready VPN session is a `VpnSession` with the client's `config`; narrow it with the new `isVpnSession()`. Billed by traffic until `sessions.stop()`.
  - New `client.compute.apps()`: the official apps and, with an API key, your own. Pass an app's `uuid` as `app` to `compute.start()`.
  - `HostingNode.services` now types the per-protocol offer of a VPN node (`protocols`).
  - `@octaspace/sdk-query`: `vpnQueries.list()` / `vpnKeys`, `computeQueries.apps()` / `computeKeys.apps()`.
  - `@octaspace/sdk-react`: `useVpnMachines()` and `useComputeApps()`.

### Patch Changes

- Updated dependencies [151ee53]
- Updated dependencies [151ee53]
- Updated dependencies [151ee53]
- Updated dependencies [151ee53]
- Updated dependencies [ed1cbb9]
- Updated dependencies [151ee53]
- Updated dependencies [151ee53]
- Updated dependencies
- Updated dependencies [151ee53]
- Updated dependencies [93fa47a]
  - @octaspace/sdk@1.0.0

All notable changes to `@octaspace/sdk-react` are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
