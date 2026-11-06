---
'@octaspace/sdk': minor
---

Authentication, errors and retries.

- **Breaking:** the API key is an `octa_ak_…` key of your OctaSpace account, created under Account → Credentials → API Keys, and is sent as `Authorization: Bearer <key>`. A value that already starts with `Bearer ` is accepted. When the API refuses a key that does not start with `octa_ak_`, the error message says so.
- **Breaking:** the default base URL is `DEFAULT_BASE_URL` (`https://api-dev.octa.space`).
- New `baseUrls` option: a GET request moves to the next host when one cannot be reached.
- New errors `OctaConflictError` (409) and `OctaServiceUnavailableError` (503, a subclass of `OctaServerError`). **Breaking:** a 400 response throws `OctaValidationError`, like 422.
- Every `OctaApiError` has `retryAfter` and `rateLimit`; `client.rateLimit` returns the rate limit state of the latest response. **Breaking:** the error constructors take `(message, status, details)`.
- **Breaking:** GET requests are retried on network errors and on 429, 502, 503 and 504, not on 500. They honour `Retry-After` up to 60 seconds; a longer wait throws at once.
- Responses without a body no longer fail to parse.
