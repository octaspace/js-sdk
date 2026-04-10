import type { Node, NodeDetail, OctaClient, RequestOverrides, Session } from '@octaspace/sdk'
import { act, render, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { OctaProvider, useNetworkStats, useNode, useNodes, useSessions } from '../../src/index.js'

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void

  const promise = new Promise<T>((nextResolve, nextReject) => {
    resolve = nextResolve
    reject = nextReject
  })

  return { promise, resolve, reject }
}

describe('sdk-react hooks', () => {
  it('loads data for useNodes', async () => {
    const list = vi.fn().mockResolvedValue([{ id: 1 }] satisfies Partial<Node>[])
    const client = {
      nodes: { list },
    } as unknown as OctaClient

    const snapshots: Array<{ data: unknown; loading: boolean }> = []

    function Probe() {
      const state = useNodes()
      snapshots.push({ data: state.data, loading: state.loading })
      return null
    }

    render(
      <OctaProvider client={client}>
        <Probe />
      </OctaProvider>,
    )

    await waitFor(() => {
      expect(list).toHaveBeenCalledOnce()
      expect(snapshots.at(-1)).toEqual({
        data: [{ id: 1 }],
        loading: false,
      })
    })
  })

  it('passes AbortSignal to the SDK and aborts on unmount', async () => {
    const request = deferred<Node[]>()
    let receivedSignal: AbortSignal | undefined

    const client = {
      nodes: {
        list: vi.fn().mockImplementation((overrides?: RequestOverrides) => {
          receivedSignal = overrides?.signal
          return request.promise
        }),
      },
    } as unknown as OctaClient

    function Probe() {
      useNodes()
      return null
    }

    const mounted = render(
      <OctaProvider client={client}>
        <Probe />
      </OctaProvider>,
    )

    expect(receivedSignal).toBeDefined()
    expect(receivedSignal?.aborted).toBe(false)

    await act(async () => {
      mounted.unmount()
    })

    expect(receivedSignal?.aborted).toBe(true)
    request.resolve([])
  })

  it('does not run disabled parameterized hook without id', async () => {
    const get = vi.fn()
    const client = {
      nodes: { get },
    } as unknown as OctaClient

    function Probe() {
      useNode(undefined)
      return null
    }

    render(
      <OctaProvider client={client}>
        <Probe />
      </OctaProvider>,
    )

    expect(get).not.toHaveBeenCalled()
  })

  it('forwards session filters to the SDK', async () => {
    const list = vi.fn().mockResolvedValue([{ uuid: 'sess-1' }] satisfies Partial<Session>[])
    const client = {
      sessions: { list },
    } as unknown as OctaClient

    function Probe() {
      useSessions({ recent: true })
      return null
    }

    render(
      <OctaProvider client={client}>
        <Probe />
      </OctaProvider>,
    )

    await waitFor(() => {
      expect(list).toHaveBeenCalledWith(
        { recent: true },
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      )
    })
  })

  it('exposes network stats without requiring an authenticated client', async () => {
    const get = vi.fn().mockResolvedValue({ market_price: 1.25 })
    const client = {
      network: { get },
    } as unknown as OctaClient

    const snapshots: Array<{ data: unknown; loading: boolean }> = []

    function Probe() {
      const state = useNetworkStats()
      snapshots.push({ data: state.data, loading: state.loading })
      return null
    }

    render(
      <OctaProvider client={client}>
        <Probe />
      </OctaProvider>,
    )

    await waitFor(() => {
      expect(get).toHaveBeenCalledOnce()
      expect(snapshots.at(-1)).toEqual({
        data: { market_price: 1.25 },
        loading: false,
      })
    })
  })
})
