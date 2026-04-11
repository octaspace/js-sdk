import type { OctaClient } from '@octaspace/sdk'
import { describe, expect, it, vi } from 'vitest'
import { idleJobKeys, idleJobQueries } from '../../src/queries/idle-jobs.js'
import { callQueryFn } from './helpers.js'

const makeClient = () =>
  ({
    idleJobs: {
      get: vi.fn().mockResolvedValue({ id: 1 }),
      logs: vi.fn().mockResolvedValue('log output'),
    },
  }) as unknown as OctaClient

describe('idleJobKeys', () => {
  it('produces stable query keys', () => {
    expect(idleJobKeys.all()).toEqual(['@octaspace', 'idleJobs'])
    expect(idleJobKeys.detail(1, 2)).toEqual(['@octaspace', 'idleJobs', 'detail', 1, 2])
    expect(idleJobKeys.logs(1, 2)).toEqual(['@octaspace', 'idleJobs', 'logs', 1, 2])
  })

  it('keys differ by nodeId and jobId', () => {
    expect(idleJobKeys.detail(1, 2)).not.toEqual(idleJobKeys.detail(1, 3))
    expect(idleJobKeys.detail(1, 2)).not.toEqual(idleJobKeys.detail(2, 2))
  })
})

describe('idleJobQueries.detail', () => {
  it('sets the correct queryKey', () => {
    const opts = idleJobQueries.detail(makeClient(), 1, 2)
    expect(opts.queryKey).toEqual(idleJobKeys.detail(1, 2))
  })

  it('queryFn calls client.idleJobs.get() with nodeId and jobId', async () => {
    const client = makeClient()
    await callQueryFn(idleJobQueries.detail(client, 1, 2))
    expect(client.idleJobs.get).toHaveBeenCalledWith(1, 2)
  })
})

describe('idleJobQueries.logs', () => {
  it('sets the correct queryKey', () => {
    const opts = idleJobQueries.logs(makeClient(), 1, 2)
    expect(opts.queryKey).toEqual(idleJobKeys.logs(1, 2))
  })

  it('queryFn calls client.idleJobs.logs() with nodeId and jobId', async () => {
    const client = makeClient()
    await callQueryFn(idleJobQueries.logs(client, 1, 2))
    expect(client.idleJobs.logs).toHaveBeenCalledWith(1, 2)
  })
})
