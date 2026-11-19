---
'@octaspace/sdk': minor
'@octaspace/sdk-query': minor
'@octaspace/sdk-react': minor
---

VPN and compute apps.

- New `client.vpn` with `list()` (works without an API key) and `start({ node_number, subkind, protocol? })`. A ready VPN session is a `VpnSession` with the client's `config`; narrow it with the new `isVpnSession()`. Billed by traffic until `sessions.stop()`.
- New `client.compute.apps()`: the official apps and, with an API key, your own. Pass an app's `uuid` as `app` to `compute.start()`.
- `HostingNode.services` now types the per-protocol offer of a VPN node (`protocols`).
- `@octaspace/sdk-query`: `vpnQueries.list()` / `vpnKeys`, `computeQueries.apps()` / `computeKeys.apps()`.
- `@octaspace/sdk-react`: `useVpnMachines()` and `useComputeApps()`.
