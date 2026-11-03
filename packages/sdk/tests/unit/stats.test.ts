import { describe, expect, it, vi } from 'vitest'
import { OctaValidationError } from '../../src/errors/index.js'
import { gpuHistoryPoints } from '../../src/resources/stats.js'
import type { GpuCurrent, GpuHistory, GpuLocation } from '../../src/types/index.js'
import { loadFixture, makeClient, makeErrorResponse, makeResponse, sentRequest } from './helpers.js'

describe('stats.gpuCurrent', () => {
  it('GETs anonymously with the verified filter and normalizes "null" strings', async () => {
    const fixture = loadFixture<GpuCurrent>('stats_gpu_current.json')
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse(fixture))
    const client = makeClient(mockFetch)

    const current = await client.stats.gpuCurrent({ verified: 'yes' })
    expect(sentRequest(mockFetch).url).toMatch(/\/stats\/gpu\/current\?verified=yes$/)
    expect(sentRequest(mockFetch).headers.has('Authorization')).toBe(false)
    expect(current.gpus.length).toBeGreaterThan(0)
    for (const gpu of current.gpus) {
      expect(
        gpu.tflops === undefined || gpu.tflops === null || typeof gpu.tflops === 'number',
      ).toBe(true)
    }
  })

  it('surfaces validation errors', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(
        makeErrorResponse({ message: 'verified must be one of yes, no, all' }, 400),
      )
    const client = makeClient(mockFetch)

    await expect(client.stats.gpuCurrent()).rejects.toBeInstanceOf(OctaValidationError)
  })
})

describe('stats.gpuHistory', () => {
  it('builds the query from options, including Dates and model lists', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse({}))
    const client = makeClient(mockFetch)

    await client.stats.gpuHistory({
      gpuName: ['NVIDIA GeForce RTX 3090', 'Arc B580'],
      verified: 'all',
      start: new Date(1_793_555_368_000),
      end: 1_793_562_568,
      step: 3600,
    })
    const url = new URL(sentRequest(mockFetch).url)
    expect(url.pathname).toBe('/stats/gpu/history')
    expect(Object.fromEntries(url.searchParams)).toEqual({
      gpu_name: 'NVIDIA GeForce RTX 3090,Arc B580',
      verified: 'all',
      start: '1793555368',
      end: '1793562568',
      step: '3600',
    })
  })

  it('normalizes "null" strings and converts columns into points', async () => {
    const fixture = loadFixture<GpuHistory>('stats_gpu_history.json')
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse(fixture))
    const client = makeClient(mockFetch)

    const history = await client.stats.gpuHistory()
    const arc = history['Arc B580']
    expect(arc).toBeDefined()
    if (!arc) return
    expect(arc.tflops).toBeNull()

    const points = gpuHistoryPoints(arc)
    expect(points).toHaveLength(arc.timestamps.length)
    expect(points[0]).toEqual({
      ts: 1793555368,
      total: 2,
      available: 2,
      rented: 0,
      availablePrice: { p10: 50, p25: 50, p50: 50, p75: 50, p90: 50 },
      rentedPrice: { p10: null, p25: null, p50: null, p75: null, p90: null },
    })
    expect(points[1]?.rentedPrice.p50).toBe(50)
  })
})

describe('stats.gpuLocations', () => {
  it('GETs /stats/gpu/locations', async () => {
    const fixture = loadFixture<GpuLocation[]>('stats_gpu_locations.json')
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse(fixture))
    const client = makeClient(mockFetch)

    const locations = await client.stats.gpuLocations()
    expect(sentRequest(mockFetch).url).toMatch(/\/stats\/gpu\/locations$/)
    expect(locations).toEqual(fixture)
  })
})
