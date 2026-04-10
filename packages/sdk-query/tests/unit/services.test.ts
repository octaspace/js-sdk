import type { OctaClient } from '@octaspace/sdk'
import { describe, expect, it, vi } from 'vitest'
import {
  mrKeys,
  mrQueries,
  renderKeys,
  renderQueries,
  serviceSessionKeys,
  serviceSessionQueries,
  vpnKeys,
  vpnQueries,
} from '../../src/queries/services.js'
import { callQueryFn } from './helpers.js'

const makeSessionResource = () => ({
  info: vi.fn().mockResolvedValue({ uuid: 'abc', kind: 'mr' }),
  logs: vi.fn().mockResolvedValue({ entries: [] }),
})

const makeClient = () => {
  const sessionResource = makeSessionResource()
  return {
    services: {
      mr: { available: vi.fn().mockResolvedValue([]) },
      render: { available: vi.fn().mockResolvedValue([]) },
      vpn: { available: vi.fn().mockResolvedValue([]) },
      session: vi.fn().mockReturnValue(sessionResource),
    },
    _sessionResource: sessionResource,
  } as unknown as OctaClient & { _sessionResource: ReturnType<typeof makeSessionResource> }
}

describe('mrKeys', () => {
  it('produces stable query keys', () => {
    expect(mrKeys.all()).toEqual(['@octaspace', 'services', 'mr'])
    expect(mrKeys.available()).toEqual(['@octaspace', 'services', 'mr', 'available'])
  })
})

describe('mrQueries.available', () => {
  it('sets the correct queryKey', () => {
    const opts = mrQueries.available(makeClient())
    expect(opts.queryKey).toEqual(mrKeys.available())
  })

  it('queryFn calls client.services.mr.available()', async () => {
    const client = makeClient()
    await callQueryFn(mrQueries.available(client))
    expect(client.services.mr.available).toHaveBeenCalledOnce()
  })
})

describe('renderKeys', () => {
  it('produces stable query keys', () => {
    expect(renderKeys.all()).toEqual(['@octaspace', 'services', 'render'])
    expect(renderKeys.available()).toEqual(['@octaspace', 'services', 'render', 'available'])
  })
})

describe('renderQueries.available', () => {
  it('sets the correct queryKey', () => {
    const opts = renderQueries.available(makeClient())
    expect(opts.queryKey).toEqual(renderKeys.available())
  })

  it('queryFn calls client.services.render.available()', async () => {
    const client = makeClient()
    await callQueryFn(renderQueries.available(client))
    expect(client.services.render.available).toHaveBeenCalledOnce()
  })
})

describe('vpnKeys', () => {
  it('produces stable query keys', () => {
    expect(vpnKeys.all()).toEqual(['@octaspace', 'services', 'vpn'])
    expect(vpnKeys.available()).toEqual(['@octaspace', 'services', 'vpn', 'available'])
  })
})

describe('vpnQueries.available', () => {
  it('sets the correct queryKey', () => {
    const opts = vpnQueries.available(makeClient())
    expect(opts.queryKey).toEqual(vpnKeys.available())
  })

  it('queryFn calls client.services.vpn.available()', async () => {
    const client = makeClient()
    await callQueryFn(vpnQueries.available(client))
    expect(client.services.vpn.available).toHaveBeenCalledOnce()
  })
})

describe('serviceSessionKeys', () => {
  it('produces stable query keys', () => {
    expect(serviceSessionKeys.all('abc')).toEqual(['@octaspace', 'services', 'session', 'abc'])
    expect(serviceSessionKeys.info('abc')).toEqual([
      '@octaspace',
      'services',
      'session',
      'abc',
      'info',
    ])
    expect(serviceSessionKeys.logs('abc')).toEqual([
      '@octaspace',
      'services',
      'session',
      'abc',
      'logs',
    ])
  })

  it('keys differ by uuid', () => {
    expect(serviceSessionKeys.info('abc')).not.toEqual(serviceSessionKeys.info('xyz'))
  })
})

describe('serviceSessionQueries.info', () => {
  it('sets the correct queryKey', () => {
    const opts = serviceSessionQueries.info(makeClient(), 'abc')
    expect(opts.queryKey).toEqual(serviceSessionKeys.info('abc'))
  })

  it('queryFn calls session(uuid).info()', async () => {
    const client = makeClient()
    await callQueryFn(serviceSessionQueries.info(client, 'abc'))
    expect(client.services.session).toHaveBeenCalledWith('abc')
    expect(client._sessionResource.info).toHaveBeenCalledOnce()
  })
})

describe('serviceSessionQueries.logs', () => {
  it('sets the correct queryKey', () => {
    const opts = serviceSessionQueries.logs(makeClient(), 'abc')
    expect(opts.queryKey).toEqual(serviceSessionKeys.logs('abc'))
  })

  it('queryFn calls session(uuid).logs()', async () => {
    const client = makeClient()
    await callQueryFn(serviceSessionQueries.logs(client, 'abc'))
    expect(client.services.session).toHaveBeenCalledWith('abc')
    expect(client._sessionResource.logs).toHaveBeenCalledOnce()
  })
})
