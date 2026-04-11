import { describe, expect, it, vi } from 'vitest'
import { makeClient, makeResponse } from './helpers.js'

const mockNode = {
  id: 42,
  ip: '1.2.3.4',
  state: 'idle',
  osn: 'Ubuntu 22.04',
  uptime: 86400,
  vrf_dt: '2026-04-15T00:00:00Z',
  location: { city: 'Berlin', country: 'Germany' },
  prices: { base: 50000000000000000, storage: 5000000000000000, traffic: 2000000000000000 },
  system: {
    arch: 'x86_64',
    cpu_cores: 32,
    cpu_load_percent: 15,
    cpu_model_name: 'AMD EPYC 7702',
    os_version: 'Ubuntu 22.04',
    disk: { free: 1e11, size: 2e11, used_percent: 50 },
    gpus: [{ model: 'RTX 4090', mem_total_mb: 24576, mem_free_mb: 20000 }],
    memory: { free: 8e10, size: 1e11 },
  },
}

const mockNodeDetail = {
  id: 42,
  state: 'idle',
  ip: '1.2.3.4',
  vrf_dt: '2026-04-15T00:00:00Z',
  location: { city: 'Berlin', country: 'Germany' },
  reliability: {
    uptime: 99,
    stability: 99,
    s_avg_d: 100,
    s_max_d: 200,
    s_normal: 5,
    s_failed: 0,
    rating: { count: 10, score: 4 },
  },
  features: [],
  data: {
    arch: 'x86_64',
    cpu_cores: 32,
    cpu_load_percent: 15,
    cpu_model_name: 'AMD EPYC 7702',
    cpu_vendor_id: 'AMD',
    cuda_version: '12.0',
    os_version: 'Ubuntu 22.04',
    is_hive_os: false,
    is_wsl: false,
    virt: 'none',
    gpu_pt: true,
    gpu_vendor: 'nvidia',
    gpus: [{ model: 'RTX 4090', mem_total_mb: 24576, mem_free_mb: 20000 }],
    disk: { free: 1e11, size: 2e11, used_percent: 50 },
    memory: {
      total_memory: 1e11,
      free_memory: 8e10,
      available_memory: 8e10,
      cached_memory: 1e10,
      buffered_memory: 1e9,
      total_swap: 8e9,
      free_swap: 8e9,
    },
    version: '0.0.73',
    uptime: 86400,
  },
}

describe('NodesResource', () => {
  it('list() returns nodes', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse([mockNode]))
    const client = makeClient(mockFetch)
    const nodes = await client.nodes.list()
    expect(nodes).toHaveLength(1)
    const [url] = mockFetch.mock.calls[0] as [string]
    expect(url).toContain('/nodes')
  })

  it('get(id) returns single node', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse(mockNodeDetail))
    const client = makeClient(mockFetch)
    const node = await client.nodes.get(42)
    expect(node.ip).toBe('1.2.3.4')
    expect(node.data.cpu_model_name).toBe('AMD EPYC 7702')
    expect(node.data.gpus[0]?.model).toBe('RTX 4090')
    const [url] = mockFetch.mock.calls[0] as [string]
    expect(url).toContain('/nodes/42')
  })

  it('downloadIdent(id) returns Blob', async () => {
    const blobContent = new Blob(['ident-data'], { type: 'application/octet-stream' })
    const mockFetch = vi.fn().mockResolvedValueOnce(new Response(blobContent))
    const client = makeClient(mockFetch)
    const result = await client.nodes.downloadIdent(42)
    expect(result).toBeInstanceOf(Blob)
    const [url] = mockFetch.mock.calls[0] as [string]
    expect(url).toContain('/nodes/42/ident')
  })

  it('downloadLogs(id) returns Blob', async () => {
    const blobContent = new Blob(['log-data'])
    const mockFetch = vi.fn().mockResolvedValueOnce(new Response(blobContent))
    const client = makeClient(mockFetch)
    const result = await client.nodes.downloadLogs(42)
    expect(result).toBeInstanceOf(Blob)
    const [url] = mockFetch.mock.calls[0] as [string]
    expect(url).toContain('/nodes/42/logs')
  })

  it('updatePrices(id, prices) sends PATCH with Wei values', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse({}))
    const client = makeClient(mockFetch)
    await client.nodes.updatePrices(42, {
      base: 50000000000000000,
      storage: 5000000000000000,
      traffic: 2000000000000000,
    })
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/nodes/42/prices')
    expect(init.method).toBe('PATCH')
  })

  it('reboot(id) sends GET to /reboot', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse({}))
    const client = makeClient(mockFetch)
    await client.nodes.reboot(42)
    const [url] = mockFetch.mock.calls[0] as [string]
    expect(url).toContain('/nodes/42/reboot')
  })
})
