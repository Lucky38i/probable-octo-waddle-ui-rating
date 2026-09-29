export type StarValue = 1 | 2 | 3 | 4 | 5

export const STAR_VALUES: readonly StarValue[] = [1, 2, 3, 4, 5]

export interface RatingBreakdownEntry {
  stars: StarValue
  count: number
}

/** Shape returned by the API. The average is optional: it's calculated from the breakdown when missing. */
export interface ProductRatingResponse {
  averageRating?: number | null
  maxRating: number
  breakdown: RatingBreakdownEntry[]
  /** The current user's own rating, if they've submitted one. */
  userRating?: StarValue | null
}

/** Rating used by the UI, always with a resolved average. */
export interface ProductRating {
  averageRating: number
  maxRating: number
  breakdown: RatingBreakdownEntry[]
  userRating: StarValue | null
}
