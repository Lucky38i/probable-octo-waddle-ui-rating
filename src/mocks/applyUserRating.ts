import type { ProductRatingResponse, StarValue } from '../types/rating'
import { getTotalReviews } from '../utils/rating'

/**
 * Mock backend logic: adds the user's rating to the base (everyone else's) ratings.
 * The base never includes the user, so re-rating replaces their previous rating
 * rather than adding a second one.
 */
export function applyUserRating(
  base: ProductRatingResponse,
  userRating: StarValue | null,
): ProductRatingResponse {
  if (userRating === null) return { ...base, userRating: null }

  const hasEntry = base.breakdown.some((entry) => entry.stars === userRating)
  const breakdown = hasEntry
    ? base.breakdown.map((entry) =>
        entry.stars === userRating ? { ...entry, count: entry.count + 1 } : entry,
      )
    : [...base.breakdown, { stars: userRating, count: 1 }]

  // Keep the backend's own (possibly weighted) average and fold the new rating into it.
  const baseTotal = getTotalReviews(base.breakdown)
  const averageRating =
    typeof base.averageRating === 'number'
      ? Math.round(((base.averageRating * baseTotal + userRating) / (baseTotal + 1)) * 100) / 100
      : base.averageRating

  return { ...base, averageRating, breakdown, userRating }
}
