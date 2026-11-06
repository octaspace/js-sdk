import { describe, expect, it, vi } from 'vitest'
import {
  OctaNotFoundError,
  OctaServerError,
  OctaSessionStoppedError,
  OctaTimeoutError,
  OctaValidationError,
} from '../../src/errors/index.js'
import { isComputeSession, isRenderSession } from '../../src/resources/sessions.js'
import type { ComputeSession, Session, SessionLogs } from '../../src/types/index.js'
import { loadFixture, makeClient, makeErrorResponse, makeResponse, sentRequest } from './helpers.js'

const UUID = '5f3c2b1a-7d6e-4f8a-9b0c-1d2e3f4a5b6c'
const notFound = () => makeErrorResponse({ message: 'Session not found' }, 404)

describe('sessions.list', () => {
  it('GETs /sessions without query parameters', async () => {
    const ready = loadFixture<ComputeSession>('session_compute_ready.json')
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse([ready]))
    const client = makeClient(mockFetch)

    const sessions = await client.sessions.list()
    expect(sentRequest(mockFetch).url).toMatch(/\/sessions$/)
    expect(sessions).toHaveLength(1)
    expect(sessions[0]?.status).toBe('ready')
  })
})

describe('sessions.get', () => {
  it('decodes a starting compute session with nulls', async () => {
    const starting = loadFixture<ComputeSession>('session_compute_starting.json')
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse(starting))
    const client = makeClient(mockFetch)

    const session = await client.sessions.get(UUID)
    expect(sentRequest(mockFetch).url).toMatch(new RegExp(`/services/${UUID}/info$`))
    expect(isComputeSession(session)).toBe(true)
    if (!isComputeSession(session)) return
    expect(session.status).toBe('starting')
    expect(session.progress).toBe('Prepare node')
    expect(session.base_price).toBeNull()
    expect(session.node_hw).toBeNull()
    expect(session.ssh).toEqual({ direct: null, proxy: null, web: null })
  })

  it('keeps "null" strings in envs as data', async () => {
    const starting = loadFixture<ComputeSession>('session_compute_starting.json')
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(makeResponse({ ...starting, envs: { VALUE: 'null' } }))
    const client = makeClient(mockFetch)

    const session = (await client.sessions.get(UUID)) as ComputeSession
    expect(session.envs).toEqual({ VALUE: 'null' })
  })

  it('decodes ssh endpoints and network speed of a ready session', async () => {
    const proxy = loadFixture<ComputeSession>('session_compute_ssh_proxy.json')
    const mbps = loadFixture<ComputeSession>('session_compute_net_mbps.json')
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(makeResponse(proxy))
      .mockResolvedValueOnce(makeResponse(mbps))
    const client = makeClient(mockFetch)

    const withProxy = (await client.sessions.get(UUID)) as ComputeSession
    expect(withProxy.ssh?.proxy?.user).toBe('root')
    expect(typeof withProxy.ssh?.proxy?.port).toBe('number')

    const withSpeed = (await client.sessions.get(UUID)) as ComputeSession
    expect(typeof withSpeed.node_hw?.net_down_mbps).toBe('number')
  })

  it('returns an unknown service as is', async () => {
    const vpn = { service: 'vpn', uuid: UUID, status: 'ready', duration: 1, config: 'x' }
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse(vpn))
    const client = makeClient(mockFetch)

    const session: Session = await client.sessions.get(UUID)
    expect(isComputeSession(session)).toBe(false)
    expect(isRenderSession(session)).toBe(false)
    expect(session).toEqual(vpn)
  })

  it('throws OctaNotFoundError for a stopped session and 400 for a bad uuid', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(notFound())
      .mockResolvedValueOnce(makeErrorResponse({ message: 'Invalid session uuid' }, 400))
    const client = makeClient(mockFetch)

    await expect(client.sessions.get(UUID)).rejects.toBeInstanceOf(OctaNotFoundError)
    await expect(client.sessions.get('not-a-uuid')).rejects.toBeInstanceOf(OctaValidationError)
  })
})

describe('sessions.logs', () => {
  it('passes tail and decodes logs', async () => {
    const logs = loadFixture<SessionLogs>('session_logs.json')
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse(logs))
    const client = makeClient(mockFetch)

    const out = await client.sessions.logs(UUID, { tail: 10 })
    expect(sentRequest(mockFetch).url).toMatch(new RegExp(`/services/${UUID}/logs\\?tail=10$`))
    expect(out.system.length).toBeGreaterThan(0)
    expect(typeof out.system[0]?.ts).toBe('number')
    expect(typeof out.container_truncated).toBe('boolean')
  })
})

describe('sessions.stop', () => {
  it('POSTs without a body and returns the uuid', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse({ uuid: UUID }, 202))
    const client = makeClient(mockFetch)

    await expect(client.sessions.stop(UUID)).resolves.toEqual({ uuid: UUID })
    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(init.method).toBe('POST')
    expect(init.body).toBeUndefined()
    expect(sentRequest(mockFetch).url).toMatch(new RegExp(`/services/${UUID}/stop$`))
  })

  it('is retried on transient errors because it is idempotent', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(makeErrorResponse({ message: 'down' }, 503))
      .mockResolvedValueOnce(makeResponse({ uuid: UUID }, 202))
    const client = makeClient(mockFetch, { retries: 1 })

    await expect(client.sessions.stop(UUID)).resolves.toEqual({ uuid: UUID })
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })
})

describe('sessions.waitReady', () => {
  const starting = () => makeResponse(loadFixture('session_compute_starting.json'))
  const ready = () => makeResponse(loadFixture('session_compute_ready.json'))

  it('polls until ready and reports progress', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(starting())
      .mockResolvedValueOnce(starting())
      .mockResolvedValueOnce(ready())
    const client = makeClient(mockFetch)
    const onProgress = vi.fn()

    const session = await client.sessions.waitReady(UUID, { intervalMs: 1, onProgress })
    expect(session.status).toBe('ready')
    expect(onProgress).toHaveBeenCalledTimes(3)
    expect(onProgress.mock.calls[0]?.[0]).toMatchObject({ status: 'starting' })
  })

  it('throws OctaSessionStoppedError when the session disappears', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(starting()).mockResolvedValueOnce(notFound())
    const client = makeClient(mockFetch)

    const err = await client.sessions.waitReady(UUID, { intervalMs: 1 }).catch((e: unknown) => e)
    expect(err).toBeInstanceOf(OctaSessionStoppedError)
    expect(err).toBeInstanceOf(OctaNotFoundError)
  })

  it('gives up after timeoutMs', async () => {
    const mockFetch = vi.fn().mockImplementation(() => Promise.resolve(starting()))
    const client = makeClient(mockFetch)

    await expect(
      client.sessions.waitReady(UUID, { intervalMs: 5, timeoutMs: 20 }),
    ).rejects.toBeInstanceOf(OctaTimeoutError)
  })

  it('stops waiting when the signal aborts', async () => {
    const mockFetch = vi.fn().mockImplementation(() => Promise.resolve(starting()))
    const client = makeClient(mockFetch)
    const controller = new AbortController()

    const wait = client.sessions.waitReady(UUID, { intervalMs: 1000, signal: controller.signal })
    setTimeout(() => controller.abort(new Error('cancelled')), 10)
    await expect(wait).rejects.toThrow('cancelled')
  })

  it('rejects with the abort reason when aborted during a poll request', async () => {
    const controller = new AbortController()
    const reason = new Error('user cancelled')
    const mockFetch = vi.fn().mockImplementation((_url: string, init: RequestInit) => {
      return new Promise((_resolve, reject) => {
        init.signal?.addEventListener('abort', () =>
          reject(new DOMException('aborted', 'AbortError')),
        )
        setTimeout(() => controller.abort(reason), 5)
      })
    })
    const client = makeClient(mockFetch)

    await expect(
      client.sessions.waitReady(UUID, { intervalMs: 1, signal: controller.signal }),
    ).rejects.toBe(reason)
  })

  it('passes other errors through', async () => {
    const mockFetch = vi.fn().mockResolvedValue(makeErrorResponse({ message: 'boom' }, 500))
    const client = makeClient(mockFetch)

    await expect(client.sessions.waitReady(UUID, { intervalMs: 1 })).rejects.toBeInstanceOf(
      OctaServerError,
    )
  })
})

describe('sessions.waitStopped', () => {
  it('resolves once info answers 404', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(makeResponse(loadFixture('session_compute_ready.json')))
      .mockResolvedValueOnce(notFound())
    const client = makeClient(mockFetch)

    await expect(client.sessions.waitStopped(UUID, { intervalMs: 1 })).resolves.toBeUndefined()
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })
})
