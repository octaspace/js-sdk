import type { OctaClient } from '@octaspace/sdk'
import { describe, expect, it, vi } from 'vitest'
import { sessionKeys, sessionQueries } from '../../src/queries/sessions.js'
import { callQueryFn } from './helpers.js'

const makeClient = () =>
  ({
    sessions: {
      list: vi.fn().mockResolvedValue([]),
      get: vi.fn().mockResolvedValue({ uuid: 'abc', status: 'ready' }),
      logs: vi.fn().mockResolvedValue({ system: [], container: null, container_truncated: false }),
    },
  }) as unknown as OctaClient & {
    sessions: Record<'list' | 'get' | 'logs', ReturnType<typeof vi.fn>>
  }

describe('sessionKeys', () => {
  it('produces stable query keys', () => {
    expect(sessionKeys.all()).toEqual(['@octaspace', 'sessions'])
    expect(sessionKeys.list()).toEqual(['@octaspace', 'sessions', 'list'])
    expect(sessionKeys.detail('abc')).toEqual(['@octaspace', 'sessions', 'detail', 'abc'])
    expect(sessionKeys.logs('abc', { tail: 50 })).toEqual([
      '@octaspace',
      'sessions',
      'logs',
      'abc',
      { tail: 50 },
    ])
  })

  it('keys differ by uuid and tail', () => {
    expect(sessionKeys.detail('abc')).not.toEqual(sessionKeys.detail('xyz'))
    expect(sessionKeys.logs('abc', { tail: 1 })).not.toEqual(sessionKeys.logs('abc'))
  })
})

describe('sessionQueries', () => {
  it('list calls client.sessions.list() with the query signal', async () => {
    const client = makeClient()
    const { signal } = new AbortController()
    const opts = sessionQueries.list(client)
    expect(opts.queryKey).toEqual(sessionKeys.list())
    await callQueryFn(opts, { signal })
    expect(client.sessions.list).toHaveBeenCalledWith({ signal })
  })

  it('detail calls client.sessions.get(uuid)', async () => {
    const client = makeClient()
    const opts = sessionQueries.detail(client, 'abc')
    expect(opts.queryKey).toEqual(sessionKeys.detail('abc'))
    await callQueryFn(opts)
    expect(client.sessions.get).toHaveBeenCalledWith('abc', undefined)
  })

  it('logs calls client.sessions.logs(uuid, options)', async () => {
    const client = makeClient()
    const opts = sessionQueries.logs(client, 'abc', { tail: 20 })
    expect(opts.queryKey).toEqual(sessionKeys.logs('abc', { tail: 20 }))
    await callQueryFn(opts)
    expect(client.sessions.logs).toHaveBeenCalledWith('abc', { tail: 20 }, undefined)
  })
})
