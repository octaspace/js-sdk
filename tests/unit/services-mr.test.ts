import { describe, expect, it, vi } from 'vitest'
import { makeClient, makeResponse } from './helpers.js'

const mockMrMachine = {
  node_id: 7,
  country: 'Germany',
  country_iso: 'DE',
  city: 'Frankfurt',
  cpu_model_name: 'AMD EPYC 7702',
  cpu_cores: 32,
  cpu_speed: 3200,
  cpu_vendor_id: 'AuthenticAMD',
  total_memory: 128849018880,
  memory_type: 'DDR4',
  memory_speed: 3200,
  free_disk: 1099511627776,
  arch: 'x86_64',
  os_version: 'Ubuntu 22.04',
  is_hive_os: false,
  is_wsl: false,
  virt: 'none',
  cuda_version: '12.1',
  gpus: [{ model: 'RTX 4090', mem_total_mb: 24576 }],
  gpu: { nvidia: [], amd: [], intel: [] },
  is_has_gpu: true,
  ai_score: 9500,
  blender_score: 4000,
  net_down_mbits: 1000,
  net_up_mbits: 1000,
  total_price_usd: 0.53,
  total_price_wei: 150000000000000000,
  total_price_ether: 0.15,
  base: 50000000000000000,
  base_ether: 0.05,
  storage: 50000000000000000,
  storage_ether: 0.05,
  traffic: 50000000000000000,
  traffic_ether: 0.05,
  reliability: {
    uptime: 99,
    stability: 99,
    s_avg_d: 100,
    s_max_d: 200,
    s_normal: 5,
    s_failed: 0,
    rating: { count: 10, score: 4 },
  },
  features: ['gpu', 'nvme'],
  available_ports: 16,
}

describe('MrService', () => {
  it('available() returns machine list with correct types', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse([mockMrMachine]))
    const client = makeClient(mockFetch)
    const machines = await client.services.mr.available()

    expect(machines).toHaveLength(1)
    expect(machines[0]?.node_id).toBe(7)
    expect(machines[0]?.total_price_usd).toBe(0.53)
    expect(machines[0]?.gpus[0]?.model).toBe('RTX 4090')

    const [url] = mockFetch.mock.calls[0] as [string]
    expect(url).toContain('/services/mr')
  })

  it('start() sends POST array and returns uuid', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse([{ uuid: 'sess-mr-1' }]))
    const client = makeClient(mockFetch)
    const result = await client.services.mr.start({
      node_id: 7,
      disk_size: 100,
      image: 'ubuntu:22.04',
      ports: [22],
    })

    expect(result.uuid).toBe('sess-mr-1')
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/services/mr')
    expect(init.method).toBe('POST')
    // body must be an array with the deploy item
    const body = JSON.parse(init.body as string) as unknown[]
    expect(Array.isArray(body)).toBe(true)
    expect((body[0] as Record<string, unknown>).node_id).toBe(7)
    expect((body[0] as Record<string, unknown>).image).toBe('ubuntu:22.04')
  })
})
