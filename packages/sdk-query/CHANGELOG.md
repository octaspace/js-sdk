# Changelog

All notable changes to `@octaspace/sdk-query` are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

---

## [0.1.0] - 2026-04-10

### Added

- Initial release
- TanStack Query v5 integration for `@octaspace/sdk`
- Framework-agnostic query factories for:
  - `accounts`
  - `apps`
  - `network`
  - `nodes`
  - `services.mr`
  - `services.render`
  - `services.vpn`
  - `services.session(uuid)`
  - `sessions`
  - `idleJobs`
- Exported query key factories for manual cache invalidation
- Re-exported `ListSessionsOptions` from `@octaspace/sdk`
- Zero runtime dependencies beyond the host TanStack Query adapter

[Unreleased]: https://github.com/octaspace/js-sdk/compare/sdk-query-v0.1.0...HEAD
[0.1.0]: https://github.com/octaspace/js-sdk/releases/tag/sdk-query-v0.1.0
