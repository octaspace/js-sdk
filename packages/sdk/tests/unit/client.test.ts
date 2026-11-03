import { describe, expect, it } from 'vitest'
import { OctaClient } from '../../src/client.js'

describe('OctaClient', () => {
  it('can be created without apiKey for public endpoints', () => {
    expect(() => new OctaClient({})).not.toThrow()
  })

  it('exposes all resource groups', () => {
    const client = new OctaClient({ apiKey: 'test_key' })
    expect(client.accounts).toBeDefined()
    expect(client.apps).toBeDefined()
    expect(client.compute).toBeDefined()
    expect(client.render).toBeDefined()
    expect(client.network).toBeDefined()
    expect(client.hosting).toBeDefined()
    expect(client.stats).toBeDefined()
    expect(client.services).toBeDefined()
    expect(client.sessions).toBeDefined()
    expect(client.idleJobs).toBeDefined()
  })

  it('services has the vpn sub-resource', () => {
    const client = new OctaClient({ apiKey: 'test_key' })
    expect(client.services.vpn).toBeDefined()
  })
})
