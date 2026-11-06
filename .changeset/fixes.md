---
'@octaspace/sdk': minor
---

Fixes.

- A successful response whose body is not JSON, for example a captive portal page, throws an `OctaApiError` with the raw `body`. A failure or timeout while reading a response throws an `OctaNetworkError` or `OctaTimeoutError` and is retried like any network error.
- Aborting a request also stops the wait between retries.
- `Retry-After` with fractional seconds is honoured, and only valid HTTP dates are read as dates.
