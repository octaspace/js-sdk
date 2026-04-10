import { describe, expect, it } from 'vitest'
import { OctaClient } from '../../src/client.js'
import { OctaError } from '../../src/errors/index.js'

describe('OctaClient', () => {
  it('throws OctaError when apiKey is missing', () => {
    expect(() => new OctaClient({ apiKey: '' })).toThrow(OctaError)
  })

  it('exposes all resource groups', () => {
    const client = new OctaClient({ apiKey: 'test_key' })
    expect(client.accounts).toBeDefined()
    expect(client.apps).toBeDefined()
    expect(client.network).toBeDefined()
    expect(client.nodes).toBeDefined()
    expect(client.services).toBeDefined()
    expect(client.sessions).toBeDefined()
    expect(client.idleJobs).toBeDefined()
  })

  it('services has mr, render, vpn sub-resources', () => {
    const client = new OctaClient({ apiKey: 'test_key' })
    expect(client.services.mr).toBeDefined()
    expect(client.services.render).toBeDefined()
    expect(client.services.vpn).toBeDefined()
    expect(typeof client.services.session).toBe('function')
  })
})
