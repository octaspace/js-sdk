---
'@octaspace/sdk': patch
---

Add `http_proxy` to `VpnSubkind` and type `ServiceInfo.config` as `string | ProxyConfig` — for `http_proxy` sessions the API returns a `{ ip, port }` object instead of a config string. New exported type: `ProxyConfig`.
