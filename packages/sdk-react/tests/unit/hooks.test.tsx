import type { HostingNode, OctaClient, RequestOverrides, Session } from '@octaspace/sdk'
import { act, render, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  OctaProvider,
  useBalance,
  useComputeMachines,
  useGpuHistory,
  useHostingNodes,
  useNetworkInfo,
  useSession,
  useSessionLogs,
  useSessions,
} from '../../src/index.js'

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
  it('loads data for useHostingNodes', async () => {
    const list = vi
      .fn()
      .mockResolvedValue([{ number: '7KQ4-M2XD-4' }] satisfies Partial<HostingNode>[])
    const client = {
      hosting: { nodes: list },
    } as unknown as OctaClient

    const snapshots: Array<{ data: unknown; loading: boolean }> = []

    function Probe() {
      const state = useHostingNodes()
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
        data: [{ number: '7KQ4-M2XD-4' }],
        loading: false,
      })
    })
  })

  it('passes AbortSignal to the SDK and aborts on unmount', async () => {
    const request = deferred<HostingNode[]>()
    let receivedSignal: AbortSignal | undefined

    const client = {
      hosting: {
        nodes: vi.fn().mockImplementation((overrides?: RequestOverrides) => {
          receivedSignal = overrides?.signal
          return request.promise
        }),
      },
    } as unknown as OctaClient

    function Probe() {
      useHostingNodes()
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
      sessions: { get },
    } as unknown as OctaClient

    function Probe() {
      useSession(undefined)
      return null
    }

    render(
      <OctaProvider client={client}>
        <Probe />
      </OctaProvider>,
    )

    expect(get).not.toHaveBeenCalled()
  })

  it('lists sessions with an abort signal', async () => {
    const list = vi.fn().mockResolvedValue([{ uuid: 'sess-1' }] satisfies Partial<Session>[])
    const client = {
      sessions: { list },
    } as unknown as OctaClient

    function Probe() {
      useSessions()
      return null
    }

    render(
      <OctaProvider client={client}>
        <Probe />
      </OctaProvider>,
    )

    await waitFor(() => {
      expect(list).toHaveBeenCalledWith(
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      )
    })
  })

  it('polls a session with refetchIntervalMs and keeps data between polls', async () => {
    const get = vi
      .fn()
      .mockResolvedValueOnce({ uuid: 'sess-1', status: 'starting' })
      .mockResolvedValue({ uuid: 'sess-1', status: 'ready' })
    const client = { sessions: { get } } as unknown as OctaClient
    const snapshots: Array<{ status: unknown; loading: boolean }> = []

    function Probe() {
      const state = useSession('sess-1', { refetchIntervalMs: 5 })
      snapshots.push({
        status: (state.data as Session | undefined)?.status,
        loading: state.loading,
      })
      return null
    }

    const mounted = render(
      <OctaProvider client={client}>
        <Probe />
      </OctaProvider>,
    )

    await waitFor(() => expect(snapshots.at(-1)?.status).toBe('ready'))
    expect(get).toHaveBeenCalledWith(
      'sess-1',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    )
    const afterFirstData = snapshots.slice(snapshots.findIndex((s) => s.status === 'starting'))
    expect(afterFirstData.every((s) => s.status !== undefined && !s.loading)).toBe(true)
    mounted.unmount()
  })

  it('does not request session logs without a uuid', () => {
    const logs = vi.fn()
    const client = { sessions: { logs } } as unknown as OctaClient

    function Probe() {
      useSessionLogs(null, { tail: 10 })
      return null
    }

    render(
      <OctaProvider client={client}>
        <Probe />
      </OctaProvider>,
    )
    expect(logs).not.toHaveBeenCalled()
  })

  it('exposes network info without requiring an authenticated client', async () => {
    const get = vi.fn().mockResolvedValue({ at: 1793555368 })
    const client = {
      network: { info: get },
    } as unknown as OctaClient

    const snapshots: Array<{ data: unknown; loading: boolean }> = []

    function Probe() {
      const state = useNetworkInfo()
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
        data: { at: 1793555368 },
        loading: false,
      })
    })
  })

  it('loads compute machines and passes the abort signal', async () => {
    const list = vi.fn().mockResolvedValue([{ node_number: '7KQ4-M2XD-4' }])
    const client = { compute: { list } } as unknown as OctaClient
    let data: unknown

    function Probe() {
      data = useComputeMachines().data
      return null
    }

    render(
      <OctaProvider client={client}>
        <Probe />
      </OctaProvider>,
    )

    await waitFor(() => expect(data).toEqual([{ node_number: '7KQ4-M2XD-4' }]))
    expect(list.mock.calls[0]?.[0]?.signal).toBeInstanceOf(AbortSignal)
  })

  it('refetches GPU history only when its options change', async () => {
    const gpuHistory = vi.fn().mockResolvedValue({})
    const client = { stats: { gpuHistory } } as unknown as OctaClient

    function Probe({ start }: { start: Date }) {
      useGpuHistory({ gpuName: ['A', 'B'], start, step: 3600 })
      return null
    }

    const mounted = render(
      <OctaProvider client={client}>
        <Probe start={new Date(1_000_000)} />
      </OctaProvider>,
    )
    await waitFor(() => expect(gpuHistory).toHaveBeenCalledTimes(1))

    mounted.rerender(
      <OctaProvider client={client}>
        <Probe start={new Date(1_000_000)} />
      </OctaProvider>,
    )
    mounted.rerender(
      <OctaProvider client={client}>
        <Probe start={new Date(2_000_000)} />
      </OctaProvider>,
    )
    await waitFor(() => expect(gpuHistory).toHaveBeenCalledTimes(2))
    expect(gpuHistory.mock.calls[1]?.[0]).toMatchObject({ gpuName: 'A,B', step: 3600 })
  })

  it('keeps initialData on mount until the response replaces it', async () => {
    const request = deferred<{ balance: number }>()
    const balance = vi.fn().mockReturnValue(request.promise)
    const client = { accounts: { balance } } as unknown as OctaClient
    const snapshots: Array<{ data: unknown; loading: boolean }> = []

    function Probe() {
      const state = useBalance({ initialData: { balance: 1, currency: 'USD', decimals: 6 } })
      snapshots.push({ data: state.data, loading: state.loading })
      return null
    }

    render(
      <OctaProvider client={client}>
        <Probe />
      </OctaProvider>,
    )
    await waitFor(() => expect(balance).toHaveBeenCalledOnce())
    expect(
      snapshots.every((s) => (s.data as { balance: number }).balance === 1 && !s.loading),
    ).toBe(true)

    await act(async () => request.resolve({ balance: 2 }))
    expect(snapshots.at(-1)?.data).toMatchObject({ balance: 2 })
  })

  it('drops the previous data when disabled, and loads again when re-enabled', async () => {
    const get = vi.fn().mockResolvedValue({ uuid: 'sess-1', status: 'ready' })
    const client = { sessions: { get } } as unknown as OctaClient
    let state: { data: unknown; loading: boolean } = { data: undefined, loading: false }

    function Probe({ uuid }: { uuid: string | null }) {
      const result = useSession(uuid)
      state = { data: result.data, loading: result.loading }
      return null
    }

    const view = (uuid: string | null) => (
      <OctaProvider client={client}>
        <Probe uuid={uuid} />
      </OctaProvider>
    )
    const mounted = render(view('sess-1'))
    await waitFor(() => expect(state.data).toEqual({ uuid: 'sess-1', status: 'ready' }))

    mounted.rerender(view(null))
    await waitFor(() => expect(state).toEqual({ data: undefined, loading: false }))

    let resolveSecond: (value: unknown) => void = () => {}
    get.mockReturnValueOnce(new Promise((resolve) => (resolveSecond = resolve)))
    mounted.rerender(view('sess-1'))
    await waitFor(() => expect(state).toEqual({ data: undefined, loading: true }))
    await act(async () => resolveSecond({ uuid: 'sess-1', status: 'starting' }))
    expect(state).toEqual({ data: { uuid: 'sess-1', status: 'starting' }, loading: false })
  })
})
