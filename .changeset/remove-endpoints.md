---
'@octaspace/sdk': minor
'@octaspace/sdk-query': minor
'@octaspace/sdk-react': minor
---

Removed resources.

- `@octaspace/sdk`: **Breaking:** `client.apps`, `client.idleJobs` and `client.services` (`vpn`) are removed with their types (`App`, `IdleJob`, `VpnNode`, `StartVpnOptions`, …), and no method returns a `Blob` any more. The client has `accounts`, `compute`, `hosting`, `network`, `render`, `sessions` and `stats`. `new OctaClient()` takes no required options.
- `@octaspace/sdk-query`: **Breaking:** `appQueries`, `idleJobQueries`, `vpnQueries` and their keys are removed.
- `@octaspace/sdk-react`: **Breaking:** `useApps`, `useIdleJob`, `useIdleJobLogs` and `useVpnAvailable` are removed. `useOctaRequest` is exported for your own requests.
