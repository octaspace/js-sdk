---
'@octaspace/sdk': minor
'@octaspace/sdk-query': minor
'@octaspace/sdk-react': minor
---

Sessions.

- `@octaspace/sdk`: `client.sessions` gains `get(uuid)`, `logs(uuid, { tail })`, `stop(uuid)`, `waitReady(uuid, { intervalMs, timeoutMs, signal, onProgress })` and `waitStopped(uuid)`. A session is a `ComputeSession` or `RenderSession`, told apart by `service` or with `isComputeSession()` / `isRenderSession()`. `status` is `starting` or `ready`, with `progress` and `pull_percent`; SSH access is in `ssh.direct`, `ssh.proxy` and `ssh.web`. A stopped session throws `OctaNotFoundError`, and `waitReady()` throws `OctaSessionStoppedError` when the session stops while starting. When their `signal` aborts, `waitReady()` and `waitStopped()` reject with its reason. Stopping a session twice is safe, so `stop()` is retried like a GET.
- `@octaspace/sdk`: **Breaking:** `sessions.list()` takes no options and returns running sessions only. `client.services.session(uuid)`, `stop({ score })`, `ListSessionsOptions` and the old session types (`ServiceInfo`, `SessionPrices`, `SshAccess`, …) are removed.
- `@octaspace/sdk-query`: new `sessionQueries.detail(uuid)` and `sessionQueries.logs(uuid, { tail })` with matching `sessionKeys`. **Breaking:** `serviceSessionQueries`, `serviceSessionKeys` and the `recent` option are removed.
- `@octaspace/sdk-react`: new `useSession(uuid)` and `useSessionLogs(uuid, { tail })`. Every hook accepts `refetchIntervalMs` for polling, `refetch()` keeps the current data, and results carry `fetching`. **Breaking:** `useSessions()` takes no filters; `useServiceSessionInfo` and `useServiceSessionLogs` are removed.
