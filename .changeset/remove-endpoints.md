---
'@octaspace/sdk': minor
---

Removed resources.

- **Breaking:** `client.apps`, `client.idleJobs` and `client.services` (`vpn`) are removed with their types (`App`, `IdleJob`, `VpnNode`, `StartVpnOptions`, …), and no method returns a `Blob` any more. The client has `accounts`, `compute`, `hosting`, `network`, `render`, `sessions` and `stats`. `new OctaClient()` takes no required options.
