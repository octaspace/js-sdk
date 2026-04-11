# Changelog

All notable changes to `@octaspace/sdk` are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).  
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Changed

- `apiKey` is now optional at `OctaClient` construction time when using only public endpoints such as `network.get()`
- Protected endpoints now fail lazily with `OctaAuthenticationError` if called without `apiKey`
- Read-only resource methods accept optional request overrides (`signal`, `retries`) for UI integrations and request cancellation

### Removed

- Removed the unused `IdleJobLogs` public type export; `idleJobs.logs()` continues to return `string`

---

## [0.1.0] — 2026-04-10

### Added

- Initial release
- `OctaClient` with full resource coverage:
  - `accounts` — account details, balance, wallet generation
  - `apps` — available applications
  - `network` — public network statistics (no auth required)
  - `nodes` — list, get, pricing, reboot, binary file downloads
  - `services.mr` — Machine Rental: browse and start sessions
  - `services.render` — Render: browse and start sessions
  - `services.vpn` — VPN: browse and start sessions (WireGuard, OpenVPN, Shadowsocks, V2Ray)
  - `services.session(uuid)` — universal session lifecycle: info, logs, stop
  - `sessions` — list active and recent sessions
  - `idleJobs` — job status and auto-decoded log streaming
- Typed error hierarchy: `OctaError`, `OctaNetworkError`, `OctaTimeoutError`, `OctaApiError` and HTTP-specific subclasses
- Automatic retry with exponential backoff + full jitter for GET requests (respects `Retry-After`)
- `AbortSignal` support for per-request timeout and cancellation
- Injectable `fetch` for testing, proxying, and custom runtimes
- `onRequest` / `onResponse` hooks for logging and tracing
- Dual ESM + CJS build with TypeScript declarations
- Zero runtime dependencies

[Unreleased]: https://github.com/octaspace/js-sdk/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/octaspace/js-sdk/releases/tag/v0.1.0
