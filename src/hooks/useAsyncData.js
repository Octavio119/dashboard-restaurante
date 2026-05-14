/**
 * useAsyncData — lightweight hook for one-off async fetches.
 *
 * Complements TanStack Query for data that doesn't need caching or
 * background refetch (e.g. modal detail views, side-panel loads).
 *
 * @param {Function}  fetcher      — async function that returns the data
 * @param {Array}     deps         — re-runs the fetch when these change (like useEffect deps)
 * @param {Object}    [options]
 * @param {*}         [options.initialData=null]  — value before first fetch completes
 * @param {boolean}   [options.skip=false]        — set true to skip fetching (e.g. modal closed)
 * @param {Function}  [options.onSuccess]         — called with data after a successful fetch
 * @param {Function}  [options.onError]           — called with Error after a failed fetch
 *
 * @returns {{ data, loading, error, refetch }}
 *
 * @example
 * // In a component:
 * const { data, loading, error, refetch } = useAsyncData(
 *   () => api.getCliente(clienteId),
 *   [clienteId],
 *   { skip: !clienteId }
 * )
 */

import { useState, useEffect, useCallback, useRef } from 'react'

export function useAsyncData(fetcher, deps = [], options = {}) {
  const { initialData = null, skip = false, onSuccess, onError } = options

  const [data,    setData]    = useState(initialData)
  const [loading, setLoading] = useState(!skip)
  const [error,   setError]   = useState(null)

  // Prevent state updates after unmount
  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const run = useCallback(async () => {
    if (skip) { setLoading(false); return }
    setLoading(true)
    setError(null)
    try {
      const result = await fetcher()
      if (!mountedRef.current) return
      setData(result)
      onSuccess?.(result)
    } catch (err) {
      if (!mountedRef.current) return
      const msg = err?.message || 'Error al cargar datos'
      setError(msg)
      onError?.(err)
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip, ...deps])

  useEffect(() => { run() }, [run])

  return { data, loading, error, refetch: run }
}
