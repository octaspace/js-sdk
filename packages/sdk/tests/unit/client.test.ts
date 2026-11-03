import { describe, expect, it } from 'vitest'
import { OctaClient } from '../../src/client.js'
import * as sdk from '../../src/index.js'

describe('OctaClient', () => {
  it('can be created without options for public endpoints', () => {
    expect(() => new OctaClient()).not.toThrow()
    expect(() => new OctaClient({})).not.toThrow()
  })

  it('exposes the next API resources only', () => {
    const client = new OctaClient({ apiKey: 'octa_ak_test' })
    const resources = Object.keys(client).filter((key) => key !== 'transport')
    expect(resources.sort()).toEqual([
      'accounts',
      'compute',
      'hosting',
      'network',
      'render',
      'sessions',
      'stats',
    ])
  })

  it('exports no legacy API', () => {
    const names = Object.keys(sdk)
    for (const legacy of [
      'NodesResource',
      'AppsResource',
      'IdleJobsResource',
      'ServicesResource',
    ]) {
      expect(names).not.toContain(legacy)
    }
    expect(names).toEqual(
      expect.arrayContaining(['OctaClient', 'BASE_URL_DEV', 'formatUsd', 'gpuHistoryPoints']),
    )
  })
})
