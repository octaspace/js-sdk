import type { OctaClient } from '@octaspace/sdk'
import { describe, expect, it, vi } from 'vitest'
import { appKeys, appQueries } from '../../src/queries/apps.js'
import { callQueryFn } from './helpers.js'

const makeClient = () =>
  ({
    apps: {
      list: vi.fn().mockResolvedValue([]),
    },
  }) as unknown as OctaClient

describe('appKeys', () => {
  it('produces stable query keys', () => {
    expect(appKeys.all()).toEqual(['@octaspace', 'apps'])
    expect(appKeys.list()).toEqual(['@octaspace', 'apps', 'list'])
  })
})

describe('appQueries.list', () => {
  it('sets the correct queryKey', () => {
    const opts = appQueries.list(makeClient())
    expect(opts.queryKey).toEqual(appKeys.list())
  })

  it('queryFn calls client.apps.list()', async () => {
    const client = makeClient()
    await callQueryFn(appQueries.list(client))
    expect(client.apps.list).toHaveBeenCalledOnce()
  })
})
