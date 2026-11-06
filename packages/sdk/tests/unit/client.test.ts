import { describe, expect, it } from 'vitest'
import { OctaClient } from '../../src/client.js'
import * as sdk from '../../src/index.js'

describe('OctaClient', () => {
  it('can be created without options for public endpoints', () => {
    expect(() => new OctaClient()).not.toThrow()
    expect(() => new OctaClient({})).not.toThrow()
  })

  it('exposes exactly the supported resources', () => {
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

  it('exports no removed resources', () => {
    const names = Object.keys(sdk)
    for (const removed of [
      'NodesResource',
      'AppsResource',
      'IdleJobsResource',
      'ServicesResource',
    ]) {
      expect(names).not.toContain(removed)
    }
    expect(names).toEqual(
      expect.arrayContaining(['OctaClient', 'DEFAULT_BASE_URL', 'formatUsd', 'gpuHistoryPoints']),
    )
  })
})
