import { describe, expect, it, vi } from 'vitest'
import { makeClient, makeResponse } from './helpers.js'

describe('SessionsResource', () => {
  it('list() returns active sessions', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse([{ uuid: 'sess-1' }]))
    const client = makeClient(mockFetch)
    const sessions = await client.sessions.list()

    expect(sessions[0]?.uuid).toBe('sess-1')
    const [url] = mockFetch.mock.calls[0] as [string]
    expect(url).toContain('/sessions')
    expect(url).not.toContain('recent=true')
  })

  it('list({ recent: true }) adds recent query param', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse([]))
    const client = makeClient(mockFetch)
    await client.sessions.list({ recent: true })

    const [url] = mockFetch.mock.calls[0] as [string]
    expect(url).toContain('recent=true')
  })
})
