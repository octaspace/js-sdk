---
'@octaspace/sdk': minor
'@octaspace/sdk-query': minor
'@octaspace/sdk-react': minor
---

Sessions.

- `@octaspace/sdk`: `client.sessions` gains `get(uuid)`, `logs(uuid, { tail })`, `stop(uuid)`, `waitReady(uuid, { intervalMs, timeoutMs, signal, onProgress })` and `waitStopped(uuid)`. Sessions are `ComputeSession | RenderSession` (discriminated by `service`, with `isComputeSession` / `isRenderSession`); an unknown service is returned as is. `status` is `starting | ready` with `progress` and `pull_percent`; SSH access is grouped in `ssh { direct, proxy, web }`. Only running sessions exist: a stopped one answers 404 (`OctaNotFoundError`), and `waitReady` throws `OctaSessionStoppedError` when the session stops while starting. `stop` (202) is idempotent and retried like a GET. **Removed:** `client.services.session(uuid)`, `sessions.list({ recent })`, `stop({ score })`, `ListSessionsOptions` and the old session types (`ServiceInfo`, `SessionPrices`, `SshAccess`, …).
- `@octaspace/sdk-query`: `sessionQueries.list` / `detail(uuid)` / `logs(uuid, { tail })` and matching `sessionKeys`. **Removed:** `serviceSessionQueries` / `serviceSessionKeys` and the `recent` option.
- `@octaspace/sdk-react`: `useSession(uuid)` and `useSessionLogs(uuid, { tail })`; `useSessions()` takes no filters. Every hook accepts `refetchIntervalMs` for polling, `refetch()` keeps the current data, and results carry `fetching`. **Removed:** `useServiceSessionInfo`, `useServiceSessionLogs`.
