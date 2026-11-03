---
'@octaspace/sdk': minor
'@octaspace/sdk-query': minor
'@octaspace/sdk-react': minor
---

Remove endpoints the API no longer has.

- `@octaspace/sdk`: **removed** `client.apps`, `client.idleJobs`, `client.services` (`vpn`) and their types (`App`, `IdleJob`, `VpnNode`, `StartVpnOptions`, …), and binary (`Blob`) responses. The client now has exactly `accounts`, `compute`, `hosting`, `network`, `render`, `sessions` and `stats`; `new OctaClient()` takes no required options.
- `@octaspace/sdk-query`: **removed** `appQueries`, `idleJobQueries`, `vpnQueries` and their keys.
- `@octaspace/sdk-react`: **removed** `useApps`, `useIdleJob`, `useIdleJobLogs`, `useVpnAvailable`; `useOctaRequest` is now exported for custom requests.
