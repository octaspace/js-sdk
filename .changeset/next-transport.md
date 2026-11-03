---
'@octaspace/sdk': minor
---

Transport:

- The API key is sent as `Authorization: Bearer <key>` (keys `octa_ak_…` from Cube → Profile → Credentials). A pasted `Bearer …` value is normalized; a 401 for a key that does not start with `octa_ak_` says so.
- The default base URL is `BASE_URL_DEV` (`https://api-dev.octa.space`). New `baseUrls` option: GET requests fail over to the next URL on network errors.
- New errors: `OctaConflictError` (409) and `OctaServiceUnavailableError` (503, a subclass of `OctaServerError`). 400 is now an `OctaValidationError`, like 422.
- Every `OctaApiError` carries `retryAfter` and `rateLimit`. `client.rateLimit` returns the last `RateLimit-*` state. **Breaking:** the error constructors take `(message, status, details)`.
- Retries: GET only, on network errors and 429/502/503/504 (500 is no longer retried), honouring `Retry-After` up to 60 s; a longer wait is returned to the caller immediately.
- 202 and 204 responses without a body are accepted.
