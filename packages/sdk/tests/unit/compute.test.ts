import { describe, expect, it, vi } from 'vitest'
import {
  OctaConflictError,
  OctaRateLimitError,
  OctaValidationError,
} from '../../src/errors/index.js'
import type { ComputeApp, ComputeMachine } from '../../src/types/index.js'
import {
  loadFixture,
  makeClient,
  makeErrorResponse,
  makeResponse,
  sentBody,
  sentRequest,
} from './helpers.js'

describe('compute.list', () => {
  it('GETs /services/compute with the key when the client has one', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse([]))
    const client = makeClient(mockFetch)

    await client.compute.list()
    const { method, url, headers } = sentRequest(mockFetch)
    expect(method).toBe('GET')
    expect(url).toMatch(/\/services\/compute$/)
    expect(headers.get('Authorization')).toBe('Bearer octa_ak_test')
  })

  it('works anonymously without a key', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse([]))
    const client = makeClient(mockFetch, { apiKey: null })

    await expect(client.compute.list()).resolves.toEqual([])
    expect(sentRequest(mockFetch).headers.has('Authorization')).toBe(false)
  })

  it('decodes the listing and normalizes "null" strings in GPUs', async () => {
    const fixture = loadFixture<ComputeMachine[]>('services_compute.json')
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse(fixture))
    const client = makeClient(mockFetch)

    const machines = await client.compute.list()
    expect(machines).toHaveLength(fixture.length)

    const first = machines[0]
    expect(first?.node_number).toBe('3HW9-P6TR-8')
    expect(first?.base_price).toBe(100000)
    expect(first?.net_down_mbps).toBe(222)
    expect(first?.reliability.uptime).toBeGreaterThan(90)

    const gpus = machines.flatMap((m) => m.gpus)
    for (const gpu of gpus) {
      expect(gpu.mem_clock === null || typeof gpu.mem_clock === 'number').toBe(true)
      expect(gpu.power_limit === null || typeof gpu.power_limit === 'number').toBe(true)
    }
    expect(gpus.some((gpu) => gpu.mem_clock === null)).toBe(true)
  })

  it('coerces numeric strings and blanks in GPU integer fields', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(
        makeResponse([
          { node_number: 'A', gpus: [{ model: 'X', power_limit: '390', core_clock: '' }] },
        ]),
      )
    const client = makeClient(mockFetch)

    const [machine] = await client.compute.list()
    expect(machine?.gpus[0]?.power_limit).toBe(390)
    expect(machine?.gpus[0]?.core_clock).toBeNull()
  })
})

describe('compute.start', () => {
  it('POSTs an object and returns the uuid from 201', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse({ uuid: 'u-1' }, 201))
    const client = makeClient(mockFetch)

    const result = await client.compute.start({
      node_number: '7KQ4-M2XD-4',
      image: 'ubuntu:24.04',
      disk_size: 20,
      envs: { FOO: 'bar' },
      ports: [8080],
      http_ports: [8888],
      ssh: true,
      fm: false,
      entrypoint: 'sh -c',
      args: "'sleep infinity'",
      startup_script: 'echo hi',
    })

    expect(result).toEqual({ uuid: 'u-1' })
    expect(sentRequest(mockFetch).method).toBe('POST')
    expect(sentBody(mockFetch)).toEqual({
      node_number: '7KQ4-M2XD-4',
      image: 'ubuntu:24.04',
      disk_size: 20,
      envs: { FOO: 'bar' },
      ports: [8080],
      http_ports: [8888],
      ssh: true,
      fm: false,
      entrypoint: 'sh -c',
      args: "'sleep infinity'",
      startup_script: 'echo hi',
    })
  })

  it('sends only the fields that are set (tri-state ssh/fm stay absent)', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse({ uuid: 'u-1' }, 201))
    const client = makeClient(mockFetch)

    await client.compute.start({ node_number: '7KQ4-M2XD-4', image: 'alpine', ssh: undefined })
    expect(sentBody(mockFetch)).toEqual({ node_number: '7KQ4-M2XD-4', image: 'alpine' })
  })

  it('drops fields that are not part of the request schema', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse({ uuid: 'u-1' }, 201))
    const client = makeClient(mockFetch)
    const params = { node_number: 'N', image: 'alpine', start_command: 'echo' }

    await client.compute.start(params)
    expect(sentBody(mockFetch)).toEqual({ node_number: 'N', image: 'alpine' })
  })

  it('throws OctaValidationError with the API message on 400', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(makeErrorResponse({ message: 'Insufficient balance' }, 400))
    const client = makeClient(mockFetch)

    const err = await client.compute
      .start({ node_number: 'N', image: 'alpine' })
      .catch((e: unknown) => e)
    expect(err).toBeInstanceOf(OctaValidationError)
    expect((err as Error).message).toBe('Insufficient balance')
  })
})

describe('compute.startBatch', () => {
  it('POSTs an array, filling missing ids with positions', async () => {
    const results = [
      { id: 'a', status: 0, uuid: 'u-1' },
      { id: 1, status: 1, reason: 'node_number must be a node number, e.g. 7KQ4-M2XD-4' },
    ]
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse(results))
    const client = makeClient(mockFetch)

    const out = await client.compute.startBatch([
      { id: 'a', node_number: '7KQ4-M2XD-4', image: 'alpine' },
      { node_number: 'ZZZZ-ZZZZ-Z', image: 'alpine', fm: true },
    ])

    expect(out).toEqual(results)
    expect(sentBody(mockFetch)).toEqual([
      { id: 'a', node_number: '7KQ4-M2XD-4', image: 'alpine' },
      { id: 1, node_number: 'ZZZZ-ZZZZ-Z', image: 'alpine', fm: true },
    ])
  })
})

describe('batch ids', () => {
  it('refuses duplicate ids before sending, including a clash with a default position', async () => {
    const mockFetch = vi.fn()
    const client = makeClient(mockFetch)

    await expect(
      client.compute.startBatch([
        { id: 1, node_number: 'A', image: 'alpine' },
        { node_number: 'B', image: 'alpine' },
      ]),
    ).rejects.toThrow(/Duplicate batch id 1/)
    await expect(
      client.render.startBatch([
        { id: 'x', node_number: 'A' },
        { id: 'x', node_number: 'B' },
      ]),
    ).rejects.toBeInstanceOf(TypeError)
    expect(mockFetch).not.toHaveBeenCalled()
  })
})

describe('compute.restart', () => {
  it('POSTs without a body to keep the original parameters', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse({ uuid: 'u-1' }, 202))
    const client = makeClient(mockFetch)

    await expect(client.compute.restart('u-1')).resolves.toEqual({ uuid: 'u-1' })
    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(sentRequest(mockFetch).url).toMatch(/\/services\/compute\/u-1\/restart$/)
    expect(init.body).toBeUndefined()
  })

  it('treats empty params like no params', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse({ uuid: 'u-1' }, 202))
    const client = makeClient(mockFetch)

    await client.compute.restart('u-1', {})
    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(init.body).toBeUndefined()
  })

  it('sends the replacement parameters', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse({ uuid: 'u-1' }, 202))
    const client = makeClient(mockFetch)

    await client.compute.restart('u-1', {
      disk_size: 10,
      envs: { KEEP: '1' },
      entrypoint: 'sh -c',
      args: "'sleep 1'",
      ssh: false,
    })
    expect(sentBody(mockFetch)).toEqual({
      disk_size: 10,
      envs: { KEEP: '1' },
      entrypoint: 'sh -c',
      args: "'sleep 1'",
      ssh: false,
    })
  })

  it('returns the uuid when 202 has no body', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(new Response(null, { status: 202 }))
    const client = makeClient(mockFetch)

    await expect(client.compute.restart('u-2')).resolves.toEqual({ uuid: 'u-2' })
  })

  it('surfaces 409 and the restart cooldown without retrying', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(
        makeErrorResponse({ message: 'Session is still starting or restarting' }, 409),
      )
      .mockResolvedValueOnce(
        makeErrorResponse(
          { message: 'Session was restarted too recently, retry in 288 seconds' },
          429,
          { 'Retry-After': '288' },
        ),
      )
    const client = makeClient(mockFetch, { retries: 3 })

    await expect(client.compute.restart('u-1')).rejects.toBeInstanceOf(OctaConflictError)
    const err = (await client.compute.restart('u-1').catch((e: unknown) => e)) as OctaRateLimitError
    expect(err).toBeInstanceOf(OctaRateLimitError)
    expect(err.retryAfter).toBe(288)
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })
})

describe('compute.apps', () => {
  it('GETs /compute/apps anonymously when the client has no key', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse([]))
    const client = makeClient(mockFetch, { apiKey: null })

    await expect(client.compute.apps()).resolves.toEqual([])
    expect(sentRequest(mockFetch).method).toBe('GET')
    expect(sentRequest(mockFetch).url).toMatch(/\/compute\/apps$/)
    expect(sentRequest(mockFetch).headers.has('Authorization')).toBe(false)
  })

  it('sends the key and decodes official and personal apps', async () => {
    const fixture = loadFixture<ComputeApp[]>('compute_apps.json')
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse(fixture))
    const client = makeClient(mockFetch)

    const apps = await client.compute.apps()
    expect(sentRequest(mockFetch).headers.get('Authorization')).toBe('Bearer octa_ak_test')
    expect(apps).toHaveLength(fixture.length)
    const official = apps.find((app) => !app.personal)
    const personal = apps.find((app) => app.personal)
    expect(official?.uuid).toMatch(/^[0-9a-f-]{36}$/)
    expect(typeof official?.image).toBe('string')
    expect(typeof official?.extra?.min_disk_size).toBe('number')
    // only the account's own apps carry envs and startup_script
    expect(official && 'envs' in official).toBe(false)
    expect(official && 'startup_script' in official).toBe(false)
    expect(personal?.envs).toEqual({})
    expect(personal?.startup_script).toBe('')
  })

  it('turns "null" in category and description into null, but keeps user data as is', async () => {
    const app = {
      uuid: '5b2f1c9e-8d3a-4f6b-9c1e-2a7d4e6f8b10',
      name: 'Mine',
      image: 'ubuntu:24.04',
      personal: true,
      category: 'null',
      description: 'null',
      entrypoint: 'null',
      startup_script: 'null',
      envs: { MODE: 'null' },
    }
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse([app]))
    const client = makeClient(mockFetch)

    const [out] = await client.compute.apps()
    expect(out?.category).toBeNull()
    expect(out?.description).toBeNull()
    expect(out?.entrypoint).toBe('null')
    expect(out?.startup_script).toBe('null')
    expect(out?.envs).toEqual({ MODE: 'null' })
  })
})
