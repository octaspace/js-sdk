---
'@octaspace/sdk': minor
---

Removed resources.

- **Breaking:** `client.apps`, `client.idleJobs` and `client.services` (`vpn`) are removed with their types (`App`, `IdleJob`, `VpnNode`, `StartVpnOptions`, …), and no method returns a `Blob` any more. `new OctaClient()` takes no required options.
