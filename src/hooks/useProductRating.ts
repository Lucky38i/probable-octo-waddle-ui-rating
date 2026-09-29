import { useCallback, useEffect, useState } from 'react'
import { fetchProductRating } from '../api/productRating'
import type { ProductRating } from '../types/rating'

export type ProductRatingState =
  | { status: 'loading' }
  | { status: 'success'; data: ProductRating }
  | { status: 'error'; error: Error }

export type ProductRatingFetcher = (signal: AbortSignal) => Promise<ProductRating>

export function useProductRating(fetcher: ProductRatingFetcher = fetchProductRating) {
  const [state, setState] = useState<ProductRatingState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    fetcher(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setState({ status: 'success', data })
      },
      (error: unknown) => {
        if (controller.signal.aborted) return
        setState({
          status: 'error',
          error: error instanceof Error ? error : new Error(String(error)),
        })
      },
    )

    return () => controller.abort()
  }, [fetcher, attempt])

  const retry = useCallback(() => {
    setState({ status: 'loading' })
    setAttempt((current) => current + 1)
  }, [])

  /** Replaces the data, e.g. with the updated summary returned after submitting a rating. */
  const setRating = useCallback((data: ProductRating) => {
    setState({ status: 'success', data })
  }, [])

  return { state, retry, setRating }
}
