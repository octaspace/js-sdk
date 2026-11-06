# Errors, rate limits and retries

[← Back to README](../README.md)

**On this page:** [Error types](#error-types) · [Rate limits](#rate-limits) ·
[Retries](#retries)

## Error types

Every error the SDK throws extends `OctaError`. An error response from the API is thrown as one of
these classes. Each extends `OctaApiError`, which holds the HTTP `status`, the API's `message`, the
`requestId`, `retryAfter` and the rate limit state.

| Class | Status | Typical cause |
| --- | --- | --- |
| `OctaValidationError` | 400, 422 | A parameter is missing or invalid, or the request cannot be met (for example, an insufficient balance) |
| `OctaAuthenticationError` | 401 | The API key is missing, wrong or deleted |
| `OctaPermissionError` | 403 | Access denied |
| `OctaNotFoundError` | 404 | Unknown or stopped session, unknown node |
| `OctaConflictError` | 409 | The session is already starting or restarting |
| `OctaRateLimitError` | 429 | Too many requests, or the session was restarted too recently |
| `OctaServerError` | 5xx | A temporary problem on the API side |
| `OctaServiceUnavailableError` | 503 | The service is temporarily unavailable; a subclass of `OctaServerError` |

`OctaSessionStoppedError`, a subclass of `OctaNotFoundError`, is thrown by
[`sessions.waitReady()`](sessions.md#wait-until-ready) when the session stops while starting.

When the API cannot be reached at all (DNS, connection or TLS failure, or an aborted request), the
error is an `OctaNetworkError`; when a request takes longer than `timeoutMs`, an
`OctaTimeoutError`, its subclass.

```ts
import { OctaApiError } from '@octaspace/sdk'

try {
  await client.compute.start(params)
} catch (err) {
  if (err instanceof OctaApiError) {
    console.error(`status ${err.status}: ${err.message} (request ${err.requestId})`)
  }
  throw err
}
```

> [!TIP]
> Include the request ID when you contact support about a failed call.

## Rate limits

| Requests | Limit per minute |
| --- | --- |
| Without an API key | 60 per IP address |
| With an API key | 300 per account |
| Starting and restarting sessions | 10 per account |

`client.rateLimit` returns the limit, the remaining requests and the seconds until the limit
resets (`limit`, `remaining`, `reset`), as of the latest response. A failed call carries the same
in `OctaApiError.rateLimit`.

On an `OctaRateLimitError`, wait `retryAfter` seconds before you try again:

```ts
import { OctaRateLimitError } from '@octaspace/sdk'

if (err instanceof OctaRateLimitError) {
  const seconds = err.retryAfter ?? 1
  await new Promise((resolve) => setTimeout(resolve, seconds * 1000))
}
```

## Retries

GET requests are retried automatically on network errors and on 429, 502, 503 and 504, with
exponential backoff and jitter. They honour `Retry-After` up to 60 seconds; when the API asks to
wait longer, the `OctaRateLimitError` is thrown at once.

`sessions.stop()` is retried the same way: stopping a session twice is safe.

> [!IMPORTANT]
> Requests that cost money or change prices — starting and restarting sessions, setting prices —
> are never retried, so that they cannot run twice. Decide yourself whether to repeat them after
> an error.

Set the number of retries with the `retries` option, for the client or for one call, and the time
limit of each request with `timeoutMs`. See [Client configuration](configuration.md).
