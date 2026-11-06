---
'@octaspace/sdk': minor
'@octaspace/sdk-query': patch
'@octaspace/sdk-react': patch
---

Fixes.

- `@octaspace/sdk`: a successful response whose body is not JSON, for example a captive portal page, throws an `OctaApiError` with the raw `body`. A failure or timeout while reading a response throws an `OctaNetworkError` or `OctaTimeoutError` and is retried like any network error.
- `@octaspace/sdk`: aborting a request also stops the wait between retries.
- `@octaspace/sdk`: `Retry-After` with fractional seconds is honoured, and only valid HTTP dates are read as dates.
- `@octaspace/sdk-react`: `initialData` is kept on mount. A hook that becomes disabled, for example `useSession(null)`, drops the previous data and error, and shows `loading` again when enabled.
