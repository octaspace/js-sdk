import { describe, expect, it, vi } from 'vitest'
import { makeClient, makeResponse } from './helpers.js'

const mockApp = {
  category: 'AI',
  description: 'Test app',
  envs: { MODEL: 'gpt4' },
  extra: {},
  http_ports: [8080],
  image: 'my-image:latest',
  name: 'TestApp',
  personal: false,
  ports: [22],
  start_command: 'bash start.sh',
  uuid: 'app-uuid-1',
}

describe('AppsResource', () => {
  it('list() returns apps array', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse([mockApp]))
    const client = makeClient(mockFetch)
    const apps = await client.apps.list()

    expect(apps).toHaveLength(1)
    expect(apps[0]?.name).toBe('TestApp')
    const [url] = mockFetch.mock.calls[0] as [string]
    expect(url).toContain('/apps')
  })
})
