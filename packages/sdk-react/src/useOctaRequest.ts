import type { RequestOverrides } from '@octaspace/sdk'
import { useEffect, useRef, useState } from 'react'

export interface UseOctaRequestOptions<TData> {
  /** Set to `false` to skip the request (default `true`) */
  enabled?: boolean
  initialData?: TData
  /**
   * Refetch this many milliseconds after each request settles, e.g. to follow a session while it
   * starts. Keep it ≥ 2000 to stay within the API rate limit. Off by default.
   */
  refetchIntervalMs?: number
}

export interface UseOctaRequestResult<TData> {
  data: TData | undefined
  error: Error | undefined
  /** `true` while there is no data yet for the current inputs */
  loading: boolean
  /** `true` while any request is in flight, including a background refetch */
  fetching: boolean
  /** Fetch again, keeping the current data until the new response arrives */
  refetch: () => void
}

function sameDeps(a: readonly unknown[] | undefined, b: readonly unknown[]): boolean {
  return a !== undefined && a.length === b.length && a.every((value, i) => Object.is(value, b[i]))
}

export function useOctaRequest<TData>(
  request: ((request: RequestOverrides) => Promise<TData>) | null,
  deps: readonly unknown[],
  options: UseOctaRequestOptions<TData> = {},
): UseOctaRequestResult<TData> {
  const { enabled = true, initialData, refetchIntervalMs } = options
  const [data, setData] = useState<TData | undefined>(initialData)
  const [error, setError] = useState<Error>()
  const [loading, setLoading] = useState(enabled)
  const [fetching, setFetching] = useState(enabled)
  const [reloadToken, setReloadToken] = useState(0)
  const requestRef = useRef(request)
  const depsRef = useRef<readonly unknown[] | undefined>(undefined)

  // Sync ref safely after render to prevent Concurrent Mode tearing
  useEffect(() => {
    requestRef.current = request
  })

  // biome-ignore lint/correctness/useExhaustiveDependencies: the items of `deps` are spread into the list; the array itself is compared to tell new inputs from a refetch
  useEffect(() => {
    void reloadToken

    if (!enabled || !requestRef.current) {
      setLoading(false)
      setFetching(false)
      return
    }

    // New inputs start from scratch; a refetch for the same inputs keeps the data.
    const inputsChanged = !sameDeps(depsRef.current, deps)
    depsRef.current = deps

    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout> | undefined

    setFetching(true)
    if (inputsChanged) {
      setLoading(true)
      setError(undefined)
      setData(undefined)
    }

    void requestRef
      .current({ signal: controller.signal })
      .then((nextData) => {
        if (!controller.signal.aborted) {
          setData(nextData)
          setError(undefined)
        }
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err : new Error('Request failed'))
        }
      })
      .finally(() => {
        if (controller.signal.aborted) {
          return
        }
        setLoading(false)
        setFetching(false)
        if (refetchIntervalMs !== undefined && refetchIntervalMs > 0) {
          timer = setTimeout(() => setReloadToken((current) => current + 1), refetchIntervalMs)
        }
      })

    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [enabled, reloadToken, refetchIntervalMs, ...deps])

  return {
    data,
    error,
    loading,
    fetching,
    refetch: () => setReloadToken((current) => current + 1),
  }
}
