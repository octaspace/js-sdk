# Client configuration

[← Back to README](../README.md)

**On this page:** [Creating a client](#creating-a-client) · [Options](#options) ·
[Cancellation and timeouts](#cancellation-and-timeouts) · [Logging](#logging) ·
[Several hosts](#several-hosts)

## Creating a client

`new OctaClient()` takes your [API key](../README.md#authentication) and optional settings. Create
one client and reuse it.

```ts
import { OctaClient } from '@octaspace/sdk'

const client = new OctaClient({
  apiKey: process.env.OCTA_API_KEY,
  timeoutMs: 15_000,
  retries: 3,
  userAgent: 'my-service/1.0',
})
```

## Options

| Option | Default | Effect |
| --- | --- | --- |
| `apiKey` | none | Your API key; without it only the [calls without a key](../README.md#calls-without-an-api-key) work |
| `timeoutMs` | `30000` | Time limit of one HTTP request, in milliseconds; each retry gets its own |
| `retries` | `2` | Retries of failed GET requests; `0` turns them off |
| `userAgent` | `@octaspace/sdk/<version> (js)` | Value of the `User-Agent` header |
| `onRequest` | none | Called before each request, see [Logging](#logging) |
| `onResponse` | none | Called after each response, see [Logging](#logging) |
| `fetch` | `globalThis.fetch` | Your own `fetch`, for example for a proxy or tests |
| `baseUrl` | `DEFAULT_BASE_URL` | Another API host |
| `baseUrls` | — | Several API hosts, see [below](#several-hosts); takes precedence over `baseUrl` |

## Cancellation and timeouts

Every method that reads data takes an optional last argument with `signal` and `retries`, which
apply to that call only:

```ts
const controller = new AbortController()
setTimeout(() => controller.abort(), 5_000)

const info = await client.network.info({ signal: controller.signal })
const sessions = await client.sessions.list({ retries: 0 })
```

Aborting the signal stops the request and any retries; the call throws an `OctaNetworkError`. A
request that takes longer than `timeoutMs` throws an `OctaTimeoutError`.

`sessions.waitReady()` and `sessions.waitStopped()` take `signal` and `timeoutMs` in their options,
see [Sessions](sessions.md#wait-until-ready).

## Logging

`onRequest` receives the method, URL, headers, body and attempt number (`0` for the first try).
`onResponse` receives the request, the HTTP status, the response headers and the duration:

```ts
const client = new OctaClient({
  apiKey: process.env.OCTA_API_KEY,
  onResponse: ({ request, status, durationMs }) => {
    console.log(`${request.method} ${request.url} → ${status} (${durationMs} ms)`)
  },
})
```

> [!WARNING]
> `request.headers` contains the `Authorization` header with your API key. Do not log the headers
> as a whole.

## Several hosts

`baseUrls` takes an ordered list of API hosts. A GET request moves to the next host only when the
current one cannot be reached (DNS, connection or timeout). An HTTP error response, including
5xx, is returned as it is. Requests that change something are sent to the first host only.
