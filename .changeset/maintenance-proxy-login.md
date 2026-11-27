---
"@octaspace/sdk": minor
---

Node maintenance, HTTP proxy login and new machine fields.

- New `hosting.setMaintenance(number, on)`: takes a node off rent and puts it back.
- Every request names the calling application in the `X-OCTA-APP` header: `js-sdk` by default, or the new `app` option.
- A ready `http_proxy` session's `config` is an `HttpProxyConfig` (`ip`, `port`, `username`, `password`) instead of a string.
- `vpn.start()` takes `wg`, `awg`, `reality` and `http_proxy`; `v2ray` and its `protocol` are no longer offered by the API and are removed from `VpnStartParams` with the `V2RayProtocol` type.
- `ComputeMachine` gains `os_version`, `virt`, `country_iso`, `is_wsl`, `is_hive_os` and `gpu_pt`; `GpuModelStats` gains `memory_mb`.
