import type { OctaClient } from '@octaspace/sdk'
import { describe, expect, it, vi } from 'vitest'
import { computeKeys, computeQueries } from '../../src/queries/compute.js'
import { renderKeys, renderQueries } from '../../src/queries/render.js'
import { callQueryFn } from './helpers.js'

const makeClient = () =>
  ({
    compute: { list: vi.fn().mockResolvedValue([]) },
    render: { list: vi.fn().mockResolvedValue([]) },
  }) as unknown as OctaClient & {
    compute: { list: ReturnType<typeof vi.fn> }
    render: { list: ReturnType<typeof vi.fn> }
  }

describe('computeKeys', () => {
  it('produces stable query keys', () => {
    expect(computeKeys.all()).toEqual(['@octaspace', 'compute'])
    expect(computeKeys.list()).toEqual(['@octaspace', 'compute', 'list'])
  })
})

describe('computeQueries.list', () => {
  it('sets the correct queryKey', () => {
    expect(computeQueries.list(makeClient()).queryKey).toEqual(computeKeys.list())
  })

  it('queryFn calls client.compute.list() with the query signal', async () => {
    const client = makeClient()
    const { signal } = new AbortController()
    await callQueryFn(computeQueries.list(client), { signal })
    expect(client.compute.list).toHaveBeenCalledWith({ signal })
  })

  it('queryFn works without a signal', async () => {
    const client = makeClient()
    await callQueryFn(computeQueries.list(client))
    expect(client.compute.list).toHaveBeenCalledWith(undefined)
  })
})

describe('renderKeys', () => {
  it('produces stable query keys', () => {
    expect(renderKeys.all()).toEqual(['@octaspace', 'render'])
    expect(renderKeys.list()).toEqual(['@octaspace', 'render', 'list'])
  })
})

describe('renderQueries.list', () => {
  it('queryFn calls client.render.list() with the query signal', async () => {
    const client = makeClient()
    const { signal } = new AbortController()
    const opts = renderQueries.list(client)
    expect(opts.queryKey).toEqual(renderKeys.list())
    await callQueryFn(opts, { signal })
    expect(client.render.list).toHaveBeenCalledWith({ signal })
  })
})
