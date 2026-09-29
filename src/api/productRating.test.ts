import { http, HttpResponse } from 'msw'
import { productRatingHandlers } from '../mocks/handlers'
import { mockProductRating, mockProductRatingWithoutAverage } from '../mocks/data'
import { server } from '../test/server'
import {
  ApiError,
  fetchProductRating,
  isProductRatingResponse,
  PRODUCT_RATING_ENDPOINT,
  submitUserRating,
  toProductRating,
  USER_RATING_ENDPOINT,
} from './productRating'
import { USER_RATING_STORAGE_KEY } from '../mocks/userRatingStore'

const respondWith = (body: Record<string, unknown>) =>
  server.use(http.get(PRODUCT_RATING_ENDPOINT, () => HttpResponse.json(body)))

describe('fetchProductRating', () => {
  it('returns the product rating', async () => {
    await expect(fetchProductRating()).resolves.toEqual(mockProductRating)
  })

  it('calculates the average from the breakdown when the API omits it', async () => {
    server.use(...productRatingHandlers.withoutAverage)

    await expect(fetchProductRating()).resolves.toEqual({
      ...mockProductRatingWithoutAverage,
      averageRating: 3.8,
      userRating: null,
    })
  })

  it('calculates the average when the API sends null', async () => {
    respondWith({ ...mockProductRatingWithoutAverage, averageRating: null })

    await expect(fetchProductRating()).resolves.toMatchObject({ averageRating: 3.8 })
  })

  it('uses the API average when it differs from the calculated one', async () => {
    // The breakdown alone would give 4.6; the backend's weighted 4.2 wins.
    respondWith({ ...mockProductRating, averageRating: 4.2 })

    await expect(fetchProductRating()).resolves.toMatchObject({ averageRating: 4.2 })
  })

  it('falls back to the calculated average when the API average is out of range', async () => {
    respondWith({ ...mockProductRatingWithoutAverage, averageRating: 42 })

    await expect(fetchProductRating()).resolves.toMatchObject({ averageRating: 3.8 })
  })

  it('does not pass unknown response fields through to the UI', async () => {
    respondWith({ ...mockProductRating, internalId: 'abc' })

    await expect(fetchProductRating()).resolves.toEqual(mockProductRating)
  })

  it('throws an ApiError with the status for non-2xx responses', async () => {
    server.use(...productRatingHandlers.error)

    const error = await fetchProductRating().catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 500, message: 'Request failed with status 500' })
  })

  it('throws when the payload does not match the expected shape', async () => {
    server.use(...productRatingHandlers.invalid)

    await expect(fetchProductRating()).rejects.toThrow(
      'Received an invalid product rating response',
    )
  })

  it('rejects with a network error', async () => {
    server.use(http.get(PRODUCT_RATING_ENDPOINT, () => HttpResponse.error()))

    // Node's fetch TypeError comes from a different realm to jsdom's, so match by name.
    await expect(fetchProductRating()).rejects.toMatchObject({ name: 'TypeError' })
  })

  it('can be aborted', async () => {
    const controller = new AbortController()
    controller.abort()

    await expect(fetchProductRating(controller.signal)).rejects.toThrow()
  })
})

describe('submitUserRating', () => {
  const countFor = (rating: { breakdown: { stars: number; count: number }[] }, stars: number) =>
    rating.breakdown.find((entry) => entry.stars === stars)?.count

  it('sends a PUT with the chosen stars as JSON', async () => {
    let captured: { method: string; contentType: string | null; body: unknown } | undefined
    server.use(
      http.put(USER_RATING_ENDPOINT, async ({ request }) => {
        captured = {
          method: request.method,
          contentType: request.headers.get('Content-Type'),
          body: await request.json(),
        }
        return HttpResponse.json({ ...mockProductRating, userRating: 4 })
      }),
    )

    await submitUserRating(4)

    expect(captured).toEqual({
      method: 'PUT',
      contentType: 'application/json',
      body: { stars: 4 },
    })
  })

  it('resolves with the updated summary including the new rating', async () => {
    const updated = await submitUserRating(4)

    expect(updated.userRating).toBe(4)
    expect(countFor(updated, 4)).toBe(172)
    expect(countFor(updated, 5)).toBe(952)
    expect(updated.averageRating).toBe(4.6)
  })

  it('persists the rating so later fetches include it', async () => {
    await submitUserRating(2)

    expect(localStorage.getItem(USER_RATING_STORAGE_KEY)).toBe('2')
    const refetched = await fetchProductRating()
    expect(refetched.userRating).toBe(2)
    expect(countFor(refetched, 2)).toBe(15)
  })

  it('replaces the previous rating instead of adding another', async () => {
    await submitUserRating(5)
    const updated = await submitUserRating(1)

    expect(updated.userRating).toBe(1)
    expect(countFor(updated, 5)).toBe(952)
    expect(countFor(updated, 1)).toBe(41)
  })

  it('lets a first rating turn an unrated product into a rated one', async () => {
    server.use(...productRatingHandlers.noReviews)

    const updated = await submitUserRating(4)

    expect(updated).toMatchObject({ averageRating: 4, userRating: 4 })
    expect(countFor(updated, 4)).toBe(1)
  })

  it('throws an ApiError when the server fails', async () => {
    server.use(...productRatingHandlers.submitError)

    await expect(submitUserRating(3)).rejects.toMatchObject({
      name: 'ApiError',
      status: 500,
    })
    expect(localStorage.getItem(USER_RATING_STORAGE_KEY)).toBeNull()
  })

  it('is rejected by the mock API when the stars are invalid', async () => {
    await expect(submitUserRating(9 as never)).rejects.toMatchObject({ status: 400 })

    const response = await fetch(USER_RATING_ENDPOINT, { method: 'PUT', body: 'not json' })
    expect(response.status).toBe(400)
  })

  it('can be aborted', async () => {
    const controller = new AbortController()
    controller.abort()

    await expect(submitUserRating(3, controller.signal)).rejects.toThrow()
  })
})

describe('toProductRating', () => {
  it('fills in the calculated average', () => {
    expect(toProductRating(mockProductRatingWithoutAverage).averageRating).toBe(3.8)
  })

  it('defaults a missing user rating to null', () => {
    expect(toProductRating(mockProductRatingWithoutAverage).userRating).toBeNull()
    expect(toProductRating({ ...mockProductRating, userRating: 3 }).userRating).toBe(3)
  })
})

describe('isProductRatingResponse', () => {
  it.each([
    ['a payload with an average', mockProductRating],
    ['a payload without an average', mockProductRatingWithoutAverage],
    ['a payload with a null average', { ...mockProductRatingWithoutAverage, averageRating: null }],
    ['a payload with a user rating', { ...mockProductRating, userRating: 4 }],
  ])('accepts %s', (_, value) => {
    expect(isProductRatingResponse(value)).toBe(true)
  })

  it.each([
    ['null', null],
    ['a string', 'rating'],
    ['a non-numeric average', { averageRating: '4.6', maxRating: 5, breakdown: [] }],
    ['a missing maximum', { averageRating: 4, breakdown: [] }],
    ['a non-array breakdown', { averageRating: 4, maxRating: 5, breakdown: {} }],
    [
      'an out-of-range star',
      { averageRating: 4, maxRating: 5, breakdown: [{ stars: 6, count: 1 }] },
    ],
    [
      'a fractional star',
      { averageRating: 4, maxRating: 5, breakdown: [{ stars: 2.5, count: 1 }] },
    ],
    ['a negative count', { averageRating: 4, maxRating: 5, breakdown: [{ stars: 5, count: -1 }] }],
    ['an invalid user rating', { ...mockProductRating, userRating: 7 }],
  ])('rejects %s', (_, value) => {
    expect(isProductRatingResponse(value)).toBe(false)
  })
})
