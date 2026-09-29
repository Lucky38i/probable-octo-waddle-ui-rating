import type { ProductRating, ProductRatingResponse } from '../types/rating'

export const mockProductRating: ProductRating = {
  averageRating: 4.6,
  maxRating: 5,
  userRating: null,
  breakdown: [
    { stars: 5, count: 952 },
    { stars: 4, count: 171 },
    { stars: 3, count: 55 },
    { stars: 2, count: 14 },
    { stars: 1, count: 40 },
  ],
}

/** No `averageRating`: the UI calculates (600 + 320 + 120 + 60 + 30) / 300 ≈ 3.77, shown as 3.8. */
export const mockProductRatingWithoutAverage: ProductRatingResponse = {
  maxRating: 5,
  breakdown: [
    { stars: 5, count: 120 },
    { stars: 4, count: 80 },
    { stars: 3, count: 40 },
    { stars: 2, count: 30 },
    { stars: 1, count: 30 },
  ],
}

/** A product nobody has reviewed yet. */
export const mockProductRatingNoReviews: ProductRatingResponse = {
  maxRating: 5,
  breakdown: [
    { stars: 5, count: 0 },
    { stars: 4, count: 0 },
    { stars: 3, count: 0 },
    { stars: 2, count: 0 },
    { stars: 1, count: 0 },
  ],
}
