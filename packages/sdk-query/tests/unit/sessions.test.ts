import type { OctaClient } from '@octaspace/sdk'
import { describe, expect, it, vi } from 'vitest'
import { sessionKeys, sessionQueries } from '../../src/queries/sessions.js'
import { callQueryFn } from './helpers.js'

const makeClient = () =>
  ({
    sessions: {
      list: vi.fn().mockResolvedValue([]),
    },
  }) as unknown as OctaClient

describe('sessionKeys', () => {
  it('produces stable query keys', () => {
    expect(sessionKeys.all()).toEqual(['@octaspace', 'sessions'])
    expect(sessionKeys.list()).toEqual(['@octaspace', 'sessions', 'list', {}])
    expect(sessionKeys.list({ recent: true })).toEqual([
      '@octaspace',
      'sessions',
      'list',
      { recent: true },
    ])
  })

  it('list keys differ by recent option', () => {
    expect(sessionKeys.list({ recent: true })).not.toEqual(sessionKeys.list({ recent: false }))
  })
})

describe('sessionQueries.list', () => {
  it('sets the correct queryKey without options', () => {
    const opts = sessionQueries.list(makeClient())
    expect(opts.queryKey).toEqual(sessionKeys.list(undefined))
  })

  it('sets the correct queryKey with options', () => {
    const opts = sessionQueries.list(makeClient(), { recent: true })
    expect(opts.queryKey).toEqual(sessionKeys.list({ recent: true }))
  })

  it('queryFn calls client.sessions.list() with options', async () => {
    const client = makeClient()
    await callQueryFn(sessionQueries.list(client, { recent: true }))
    expect(client.sessions.list).toHaveBeenCalledWith({ recent: true })
  })
})
