import { describe, expect, it, vi } from 'vitest'
import { OctaServiceUnavailableError, OctaValidationError } from '../../src/errors/index.js'
import {
  networkHistoryPoints,
  normalizeNetworkHistoryOptions,
} from '../../src/resources/network.js'
import type { NetworkHistory, NetworkInfo } from '../../src/types/index.js'
import { loadFixture, makeClient, makeErrorResponse, makeResponse, sentRequest } from './helpers.js'

describe('network.info', () => {
  it('GETs /network anonymously and decodes the snapshot', async () => {
    const fixture = loadFixture<NetworkInfo>('network.json')
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse(fixture))
    const client = makeClient(mockFetch, { apiKey: null })

    const net = await client.network.info()
    expect(sentRequest(mockFetch).url).toMatch(/\/network$/)
    expect(sentRequest(mockFetch).headers.has('Authorization')).toBe(false)
    expect(typeof net.at).toBe('number')
    expect(typeof net.nodes.online).toBe('number')
    expect(typeof net.power.cpu_cores).toBe('number')
    expect(Array.isArray(net.render.frames_by_week)).toBe(true)
  })

  it('maps 503 to OctaServiceUnavailableError', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValue(makeErrorResponse({ message: 'Network information is unavailable' }, 503))
    const client = makeClient(mockFetch)

    await expect(client.network.info()).rejects.toBeInstanceOf(OctaServiceUnavailableError)
  })
})

describe('network.info "null" strings', () => {
  it('turns "null" strings into null', async () => {
    const fixture = loadFixture<NetworkInfo>('network.json')
    const body = { ...fixture, power: { ...fixture.power, gpus_rented: 'null' } }
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse(body))
    const client = makeClient(mockFetch)

    const net = await client.network.info()
    expect(net.power.gpus_rented).toBeNull()
  })
})

describe('network.history', () => {
  it('GETs /network/history anonymously with dates as Unix seconds', async () => {
    const fixture = loadFixture<NetworkHistory>('network_history.json')
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse(fixture))
    const client = makeClient(mockFetch)

    const history = await client.network.history({
      start: new Date(1_795_000_000_500),
      end: 1_795_086_400,
      step: 3600,
    })
    const url = new URL(sentRequest(mockFetch).url)
    expect(url.pathname).toBe('/network/history')
    expect(Object.fromEntries(url.searchParams)).toEqual({
      start: '1795000000',
      end: '1795086400',
      step: '3600',
    })
    expect(sentRequest(mockFetch).headers.has('Authorization')).toBe(false)
    expect(history.timestamps).toHaveLength(fixture.timestamps.length)
    expect(history.nodes_online).toHaveLength(fixture.timestamps.length)
  })

  it('sends no query without options', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse({ timestamps: [] }))
    const client = makeClient(mockFetch)

    await client.network.history()
    expect(sentRequest(mockFetch).url).toMatch(/\/network\/history$/)
  })

  it('maps a bad range to OctaValidationError', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(
        makeErrorResponse({ message: 'step must be at least 300 seconds' }, 400),
      )
    const client = makeClient(mockFetch)

    await expect(client.network.history({ step: 60 })).rejects.toBeInstanceOf(OctaValidationError)
  })
})

describe('networkHistoryPoints', () => {
  it('turns parallel arrays into one point per timestamp', () => {
    const fixture = loadFixture<NetworkHistory>('network_history.json')
    const points = networkHistoryPoints(fixture)
    expect(points).toHaveLength(fixture.timestamps.length)
    expect(points[0]).toEqual({
      ts: fixture.timestamps[0],
      nodesOnline: fixture.nodes_online[0],
      nodesAvailable: fixture.nodes_available?.[0],
      nodesRented: fixture.nodes_rented?.[0],
      countries: fixture.countries?.[0],
      gpus: fixture.gpus[0],
      gpusRented: fixture.gpus_rented[0],
      tflops: fixture.tflops[0],
      vpnNodes: fixture.vpn_nodes?.[0],
      users: fixture.users?.[0],
      sessionsRunning: fixture.sessions_running[0],
      sessions24h: fixture.sessions_24h?.[0],
    })
  })

  it('fills missing series with null', () => {
    const points = networkHistoryPoints({
      timestamps: [1, 2],
      nodes_online: [3],
      gpus: [],
      gpus_rented: [null, 1],
      tflops: [],
      sessions_running: [],
    })
    expect(points[1]).toMatchObject({ ts: 2, nodesOnline: null, gpusRented: 1, users: null })
  })
})

describe('normalizeNetworkHistoryOptions', () => {
  it('gives equal results for a Date and its Unix seconds', () => {
    expect(normalizeNetworkHistoryOptions({ start: new Date(1_000_000) })).toEqual(
      normalizeNetworkHistoryOptions({ start: 1000 }),
    )
  })
})
