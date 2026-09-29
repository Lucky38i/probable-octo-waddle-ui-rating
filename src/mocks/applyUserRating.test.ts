import type { ProductRatingResponse } from '../types/rating'
import { applyUserRating } from './applyUserRating'

const base: ProductRatingResponse = {
  averageRating: 4,
  maxRating: 5,
  breakdown: [
    { stars: 5, count: 2 },
    { stars: 3, count: 2 },
  ],
}

describe('applyUserRating', () => {
  it('returns the base data with no user rating', () => {
    expect(applyUserRating(base, null)).toEqual({ ...base, userRating: null })
  })

  it('adds the user rating to the matching star count', () => {
    const result = applyUserRating(base, 5)

    expect(result.breakdown).toEqual([
      { stars: 5, count: 3 },
      { stars: 3, count: 2 },
    ])
    expect(result.userRating).toBe(5)
  })

  it('adds a new entry when the star value is missing from the breakdown', () => {
    expect(applyUserRating(base, 1).breakdown).toContainEqual({ stars: 1, count: 1 })
  })

  it('folds the rating into the supplied average', () => {
    // (4 × 4 + 1) / 5 = 3.4
    expect(applyUserRating(base, 1).averageRating).toBe(3.4)
  })

  it('rounds the new average to two decimal places', () => {
    // (4 × 3 + 5) / 4 = 4.25 and (4.1 × 3 + 2) / 4 = 3.575, which rounds to 3.58
    const threeReviews = { ...base, breakdown: [{ stars: 4 as const, count: 3 }] }
    expect(applyUserRating(threeReviews, 5).averageRating).toBe(4.25)
    expect(applyUserRating({ ...threeReviews, averageRating: 4.1 }, 2).averageRating).toBe(3.58)
  })

  it('leaves a missing average for the client to calculate', () => {
    const { averageRating, ...withoutAverage } = base
    void averageRating

    expect(applyUserRating(withoutAverage, 4).averageRating).toBeUndefined()
  })

  it('does not mutate the base data', () => {
    const snapshot = structuredClone(base)
    applyUserRating(base, 5)

    expect(base).toEqual(snapshot)
  })
})
