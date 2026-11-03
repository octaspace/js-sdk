import { OctaNotFoundError, OctaSessionStoppedError, OctaTimeoutError } from '../errors/index.js'
import type { StartResult } from '../types/common.js'
import type {
  ComputeSession,
  RenderSession,
  Session,
  SessionLogs,
  SessionLogsOptions,
  WaitOptions,
  WaitReadyOptions,
} from '../types/session.js'
import { BaseResource } from './base.js'
import { type RequestOverrides, withRequestOverrides } from './request-options.js'

const DEFAULT_WAIT_INTERVAL_MS = 3000

/** Narrows a session to a compute session. */
export function isComputeSession(session: Session): session is ComputeSession {
  return session.service === 'compute'
}

/** Narrows a session to a render session. */
export function isRenderSession(session: Session): session is RenderSession {
  return session.service === 'render'
}

function sessionPath(uuid: string, action: string): string {
  return `/services/${encodeURIComponent(uuid)}/${action}`
}

/**
 * The account's running sessions. The API reports running sessions only: once a session stops,
 * `get`, `logs` and `stop` answer 404 (`OctaNotFoundError`), and there is no session history.
 */
export class SessionsResource extends BaseResource {
  /** Running sessions of the account, oldest first (`GET /sessions`). */
  async list(request?: RequestOverrides): Promise<Session[]> {
    const res = await this.request<Session[]>(
      withRequestOverrides({ method: 'GET', path: '/sessions' }, request),
    )
    return res.data
  }

  /**
   * A running session (`GET /services/{uuid}/info`). Throws `OctaNotFoundError` when it has
   * stopped or never existed, and `OctaValidationError` for a malformed uuid.
   */
  async get(uuid: string, request?: RequestOverrides): Promise<Session> {
    const res = await this.request<Session>(
      withRequestOverrides({ method: 'GET', path: sessionPath(uuid, 'info') }, request),
    )
    return res.data
  }

  /**
   * System log and the latest container output of a running compute session
   * (`GET /services/{uuid}/logs`). Render sessions have no logs.
   */
  async logs(
    uuid: string,
    options: SessionLogsOptions = {},
    request?: RequestOverrides,
  ): Promise<SessionLogs> {
    const res = await this.request<SessionLogs>(
      withRequestOverrides(
        { method: 'GET', path: sessionPath(uuid, 'logs'), query: { tail: options.tail } },
        request,
      ),
    )
    return res.data
  }

  /**
   * Stops a session (`POST /services/{uuid}/stop` → 202). Stopping is asynchronous: the session
   * is gone once `get()` answers 404 — use {@link waitStopped}. Repeating the call while the
   * session is stopping is harmless, so it is retried on transient errors like a GET. A session
   * stopped before its `min_rent_minutes` is charged base and storage for that long.
   */
  async stop(uuid: string, request?: RequestOverrides): Promise<StartResult> {
    const res = await this.request<StartResult | undefined>(
      withRequestOverrides(
        { method: 'POST', path: sessionPath(uuid, 'stop'), idempotent: true },
        request,
      ),
    )
    return res.data ?? { uuid }
  }

  /**
   * Polls the session until its `status` is `ready` and returns it. Throws
   * `OctaSessionStoppedError` if it stops meanwhile (e.g. its SSH setup failed), `OctaTimeoutError`
   * after `timeoutMs`, and the abort reason when `signal` aborts.
   *
   * After `compute.restart()` the session may still report `ready` for a moment: wait until it
   * leaves `ready` first if you need to observe the restart finishing.
   */
  async waitReady(uuid: string, options: WaitReadyOptions = {}): Promise<Session> {
    return this.poll(options, async (request) => {
      let session: Session
      try {
        session = await this.get(uuid, request)
      } catch (err) {
        if (err instanceof OctaNotFoundError) {
          throw new OctaSessionStoppedError(
            `Session ${uuid} stopped before it became ready: ${err.message}`,
            err.status,
            {
              ...(err.requestId !== undefined && { requestId: err.requestId }),
              ...(err.body !== undefined && { body: err.body }),
            },
          )
        }
        throw err
      }
      options.onProgress?.(session)
      return session.status === 'ready' ? session : undefined
    })
  }

  /**
   * Polls the session until the API no longer reports it (404), i.e. it has stopped. Resolves
   * immediately for a session that is already gone.
   */
  async waitStopped(uuid: string, options: WaitOptions = {}): Promise<void> {
    await this.poll(options, async (request) => {
      try {
        await this.get(uuid, request)
        return undefined
      } catch (err) {
        if (err instanceof OctaNotFoundError) {
          return true
        }
        throw err
      }
    })
  }

  private async poll<T>(
    options: WaitOptions,
    check: (request: RequestOverrides) => Promise<T | undefined>,
  ): Promise<T> {
    const intervalMs = options.intervalMs ?? DEFAULT_WAIT_INTERVAL_MS
    const deadline = options.timeoutMs !== undefined ? Date.now() + options.timeoutMs : undefined
    const request: RequestOverrides = options.signal ? { signal: options.signal } : {}

    for (;;) {
      options.signal?.throwIfAborted()
      let result: T | undefined
      try {
        result = await check(request)
      } catch (err) {
        // An abort during the poll request surfaces as a network error: report the abort reason
        // instead, as an abort between polls does.
        options.signal?.throwIfAborted()
        throw err
      }
      if (result !== undefined) {
        return result
      }
      if (deadline !== undefined && Date.now() + intervalMs > deadline) {
        throw new OctaTimeoutError(`Gave up waiting after ${options.timeoutMs}ms`)
      }
      await delay(intervalMs, options.signal)
    }
  }
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timer)
      reject(signal?.reason)
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}
