# Changelog

All notable changes to `@octaspace/sdk-react` are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Changed

- Tests use `@testing-library/react` with `jsdom` instead of deprecated `react-test-renderer`
- Hook documentation now covers public-only clients created with `new OctaClient({})`

---

## [0.1.0] - 2026-04-10

### Added

- Initial release
- `OctaProvider` and `useOctaClient()` for React context integration
- Read-only React hooks for SDK resources without requiring TanStack Query
- Automatic request cancellation via `AbortController` on unmount and dependency change

[Unreleased]: https://github.com/octaspace/js-sdk/compare/sdk-react-v0.1.0...HEAD
[0.1.0]: https://github.com/octaspace/js-sdk/releases/tag/sdk-react-v0.1.0
