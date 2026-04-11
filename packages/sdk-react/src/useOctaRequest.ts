import type { RequestOverrides } from '@octaspace/sdk'
import { useEffect, useRef, useState } from 'react'

export interface UseOctaRequestOptions<TData> {
  enabled?: boolean
  initialData?: TData
}

export interface UseOctaRequestResult<TData> {
  data: TData | undefined
  error: Error | undefined
  loading: boolean
  refetch: () => void
}

export function useOctaRequest<TData>(
  request: ((request: RequestOverrides) => Promise<TData>) | null,
  deps: readonly unknown[],
  options: UseOctaRequestOptions<TData> = {},
): UseOctaRequestResult<TData> {
  const { enabled = true, initialData } = options
  const [data, setData] = useState<TData | undefined>(initialData)
  const [error, setError] = useState<Error>()
  const [loading, setLoading] = useState(enabled)
  const [reloadToken, setReloadToken] = useState(0)
  const requestRef = useRef(request)

  // Sync ref safely after render to prevent Concurrent Mode tearing
  useEffect(() => {
    requestRef.current = request
  })

  useEffect(() => {
    void reloadToken

    if (!enabled || !requestRef.current) {
      setLoading(false)
      return
    }

    const controller = new AbortController()

    setLoading(true)
    setError(undefined)
    setData(undefined)

    void requestRef
      .current({ signal: controller.signal })
      .then((nextData) => {
        if (!controller.signal.aborted) {
          setData(nextData)
        }
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err : new Error('Request failed'))
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      })

    return () => {
      controller.abort()
    }
  }, [enabled, reloadToken, ...deps])

  return {
    data,
    error,
    loading,
    refetch: () => setReloadToken((current) => current + 1),
  }
}
