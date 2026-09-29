import type { ProductRatingResponse, RatingBreakdownEntry, StarValue } from '../types/rating'

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

export function isStarValue(value: unknown): value is StarValue {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 5
}

export type RatingLabel = 'Excellent' | 'Good' | 'Average' | 'Poor' | 'Bad'

export function getRatingLabel(averageRating: number): RatingLabel {
  if (averageRating >= 4.5) return 'Excellent'
  if (averageRating >= 3.5) return 'Good'
  if (averageRating >= 2.5) return 'Average'
  if (averageRating >= 1.5) return 'Poor'
  return 'Bad'
}

/** Fill percentage (0–100) for each star, e.g. 4.6 → [100, 100, 100, 100, 60]. */
export function getStarFillPercentages(rating: number, maxRating = 5): number[] {
  const safeRating = clamp(Number.isFinite(rating) ? rating : 0, 0, maxRating)
  return Array.from({ length: maxRating }, (_, index) =>
    Math.round(clamp(safeRating - index, 0, 1) * 100),
  )
}

export function formatRating(rating: number): string {
  return new Intl.NumberFormat('en-GB', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(rating)
}

export function formatCount(count: number): string {
  return new Intl.NumberFormat('en-GB').format(count)
}

export function getTotalReviews(breakdown: readonly RatingBreakdownEntry[]): number {
  return breakdown.reduce((total, { count }) => total + count, 0)
}

export function getPercentage(count: number, total: number): number {
  if (total <= 0) return 0
  return clamp((count / total) * 100, 0, 100)
}

export function sortBreakdownDescending(
  breakdown: readonly RatingBreakdownEntry[],
): RatingBreakdownEntry[] {
  return [...breakdown].sort((a, b) => b.stars - a.stars)
}

export function pluralise(count: number, singular: string, plural = `${singular}s`): string {
  return count === 1 ? singular : plural
}

export function formatPercentage(percentage: number): string {
  if (percentage > 0 && percentage < 1) return '<1%'
  return `${Math.round(percentage)}%`
}

/** Rounds to one decimal place so the label, stars and "x out of 5" text always agree. */
export function roundRating(rating: number): number {
  return Math.round(rating * 10) / 10
}

/** Average star rating weighted by review count, e.g. 5677 stars / 1232 reviews ≈ 4.61. */
export function calculateAverageRating(breakdown: readonly RatingBreakdownEntry[]): number {
  const totalReviews = getTotalReviews(breakdown)
  if (totalReviews === 0) return 0

  const totalStars = breakdown.reduce((sum, { stars, count }) => sum + stars * count, 0)
  return totalStars / totalReviews
}

/**
 * Prefers the API's average (the backend may weight or filter reviews) and falls back
 * to calculating it from the breakdown when it's missing or outside 0–maxRating.
 */
export function resolveAverageRating({
  averageRating,
  maxRating,
  breakdown,
}: ProductRatingResponse): number {
  const hasValidAverage =
    typeof averageRating === 'number' && averageRating >= 0 && averageRating <= maxRating

  return roundRating(hasValidAverage ? averageRating : calculateAverageRating(breakdown))
}
