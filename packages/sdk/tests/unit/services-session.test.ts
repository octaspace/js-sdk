import { describe, expect, it, vi } from 'vitest'
import { makeClient, makeResponse } from './helpers.js'

const mockServiceInfo = {
  uuid: 'sess-abc',
  service: 'mr',
  node_id: 7,
  progress: 'service configured',
  is_ready: true,
  started_at: 1712700000,
  duration: 3600,
  charge_amount: '5000000000000000',
  tx: 1024,
  rx: 512,
  ports_matrix: { '22': 10022 },
  urls: { '8080': 'https://node.octa.space/sess-abc/8080' },
  ssh_direct: { host: '1.2.3.4', port: 10022 },
  ssh_proxy: { host: 'proxy.octa.space', port: 22 },
  ssh_web: 'https://ssh.octa.space/sess-abc',
}

const mockLogs = {
  container: 'Starting container...\nReady.',
  system: [{ msg: 'Container started', ts: 1712700001 }],
}

describe('SessionResource', () => {
  it('info() returns session info with correct fields', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse(mockServiceInfo))
    const client = makeClient(mockFetch)
    const info = await client.services.session('sess-abc').info()

    expect(info.uuid).toBe('sess-abc')
    expect(info.is_ready).toBe(true)
    expect(info.progress).toBe('service configured')
    expect(info.charge_amount).toBe('5000000000000000')

    const [url] = mockFetch.mock.calls[0] as [string]
    expect(url).toContain('/services/sess-abc/info')
  })

  it('logs() returns container and system logs', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse(mockLogs))
    const client = makeClient(mockFetch)
    const logs = await client.services.session('sess-abc').logs()

    expect(logs.container).toContain('Ready')
    expect(logs.system[0]?.msg).toBe('Container started')
    expect(logs.system[0]?.ts).toBe(1712700001)

    const [url] = mockFetch.mock.calls[0] as [string]
    expect(url).toContain('/services/sess-abc/logs')
  })

  it('stop() sends POST to /stop', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse({}))
    const client = makeClient(mockFetch)
    await client.services.session('sess-abc').stop()

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/services/sess-abc/stop')
    expect(init.method).toBe('POST')
  })

  it('stop({ score }) sends score in body', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse({}))
    const client = makeClient(mockFetch)
    await client.services.session('sess-abc').stop({ score: 5 })

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(init.body).toContain('"score":5')
  })
})
