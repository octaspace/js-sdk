import type { OctaClient } from '@octaspace/sdk'
import { describe, expect, it, vi } from 'vitest'
import { nodeKeys, nodeQueries } from '../../src/queries/nodes.js'
import { callQueryFn } from './helpers.js'

const makeClient = () =>
  ({
    nodes: {
      list: vi.fn().mockResolvedValue([]),
      get: vi.fn().mockResolvedValue({ id: 1 }),
    },
  }) as unknown as OctaClient

describe('nodeKeys', () => {
  it('produces stable query keys', () => {
    expect(nodeKeys.all()).toEqual(['@octaspace', 'nodes'])
    expect(nodeKeys.list()).toEqual(['@octaspace', 'nodes', 'list'])
    expect(nodeKeys.detail(42)).toEqual(['@octaspace', 'nodes', 'detail', 42])
    expect(nodeKeys.detail('abc')).toEqual(['@octaspace', 'nodes', 'detail', 'abc'])
  })

  it('detail keys differ by id', () => {
    expect(nodeKeys.detail(1)).not.toEqual(nodeKeys.detail(2))
  })
})

describe('nodeQueries.list', () => {
  it('sets the correct queryKey', () => {
    const opts = nodeQueries.list(makeClient())
    expect(opts.queryKey).toEqual(nodeKeys.list())
  })

  it('queryFn calls client.nodes.list()', async () => {
    const client = makeClient()
    await callQueryFn(nodeQueries.list(client))
    expect(client.nodes.list).toHaveBeenCalledOnce()
  })
})

describe('nodeQueries.detail', () => {
  it('sets the correct queryKey', () => {
    const opts = nodeQueries.detail(makeClient(), 42)
    expect(opts.queryKey).toEqual(nodeKeys.detail(42))
  })

  it('queryFn calls client.nodes.get() with id', async () => {
    const client = makeClient()
    await callQueryFn(nodeQueries.detail(client, 42))
    expect(client.nodes.get).toHaveBeenCalledWith(42)
  })
})
