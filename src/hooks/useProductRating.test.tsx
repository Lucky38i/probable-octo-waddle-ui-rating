import { act, renderHook, waitFor } from '@testing-library/react'
import { productRatingHandlers } from '../mocks/handlers'
import { mockProductRating } from '../mocks/data'
import { server } from '../test/server'
import { useProductRating, type ProductRatingFetcher } from './useProductRating'

describe('useProductRating', () => {
  it('starts loading and resolves with data', async () => {
    const { result } = renderHook(() => useProductRating())

    expect(result.current.state).toEqual({ status: 'loading' })
    await waitFor(() =>
      expect(result.current.state).toEqual({ status: 'success', data: mockProductRating }),
    )
  })

  it('replaces the data with setRating', async () => {
    const { result } = renderHook(() => useProductRating())
    await waitFor(() => expect(result.current.state.status).toBe('success'))
    const updated = { ...mockProductRating, userRating: 5 as const }

    act(() => result.current.setRating(updated))

    expect(result.current.state).toEqual({ status: 'success', data: updated })
  })

  it('exposes errors and recovers on retry', async () => {
    server.use(...productRatingHandlers.errorOnce)
    const { result } = renderHook(() => useProductRating())

    await waitFor(() => expect(result.current.state.status).toBe('error'))

    act(() => result.current.retry())
    expect(result.current.state).toEqual({ status: 'loading' })

    await waitFor(() => expect(result.current.state.status).toBe('success'))
  })

  it('wraps non-Error rejections in an Error', async () => {
    const fetcher: ProductRatingFetcher = () => Promise.reject('boom')
    const { result } = renderHook(() => useProductRating(fetcher))

    await waitFor(() => expect(result.current.state.status).toBe('error'))
    const { state } = result.current
    expect(state.status === 'error' && state.error.message).toBe('boom')
  })

  it('aborts the request and ignores late results after unmount', async () => {
    let capturedSignal: AbortSignal | undefined
    let resolveRequest: (value: typeof mockProductRating) => void = () => {}
    const fetcher: ProductRatingFetcher = (signal) => {
      capturedSignal = signal
      return new Promise((resolve) => {
        resolveRequest = resolve
      })
    }
    const { result, unmount } = renderHook(() => useProductRating(fetcher))

    unmount()
    resolveRequest(mockProductRating)
    await Promise.resolve()

    expect(capturedSignal?.aborted).toBe(true)
    expect(result.current.state.status).toBe('loading')
  })

  it('ignores rejections from aborted requests', async () => {
    let rejectRequest: (reason: unknown) => void = () => {}
    const fetcher: ProductRatingFetcher = () =>
      new Promise((_, reject) => {
        rejectRequest = reject
      })
    const { result, unmount } = renderHook(() => useProductRating(fetcher))

    unmount()
    rejectRequest(new DOMException('Aborted', 'AbortError'))
    await Promise.resolve()

    expect(result.current.state.status).toBe('loading')
  })
})
