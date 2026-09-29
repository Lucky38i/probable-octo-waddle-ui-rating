import type {
  ProductRating,
  ProductRatingResponse,
  RatingBreakdownEntry,
  StarValue,
} from '../types/rating'
import { isStarValue, resolveAverageRating } from '../utils/rating'
import { API_BASE_URL } from './config'

export const PRODUCT_RATING_ENDPOINT = `${API_BASE_URL}/product-rating`
export const USER_RATING_ENDPOINT = `${PRODUCT_RATING_ENDPOINT}/user-rating`

export class ApiError extends Error {
  readonly status: number | undefined

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isBreakdownEntry = (value: unknown): value is RatingBreakdownEntry =>
  isRecord(value) && isStarValue(value.stars) && typeof value.count === 'number' && value.count >= 0

const isOptionalNumber = (value: unknown) =>
  value === undefined || value === null || typeof value === 'number'

const isOptionalStarValue = (value: unknown) =>
  value === undefined || value === null || isStarValue(value)

export function isProductRatingResponse(value: unknown): value is ProductRatingResponse {
  return (
    isRecord(value) &&
    isOptionalNumber(value.averageRating) &&
    typeof value.maxRating === 'number' &&
    Array.isArray(value.breakdown) &&
    value.breakdown.every(isBreakdownEntry) &&
    isOptionalStarValue(value.userRating)
  )
}

export function toProductRating(response: ProductRatingResponse): ProductRating {
  return {
    averageRating: resolveAverageRating(response),
    maxRating: response.maxRating,
    breakdown: response.breakdown,
    userRating: response.userRating ?? null,
  }
}

async function parseRatingResponse(response: Response): Promise<ProductRating> {
  if (!response.ok) {
    throw new ApiError(`Request failed with status ${response.status}`, response.status)
  }

  const data: unknown = await response.json()
  if (!isProductRatingResponse(data)) {
    throw new ApiError('Received an invalid product rating response', response.status)
  }

  return toProductRating(data)
}

export async function fetchProductRating(signal?: AbortSignal): Promise<ProductRating> {
  const response = await fetch(PRODUCT_RATING_ENDPOINT, {
    signal,
    headers: { Accept: 'application/json' },
  })

  return parseRatingResponse(response)
}

/**
 * Creates or replaces the current user's rating (PUT is idempotent, so re-rating
 * replaces the previous value). Resolves with the updated rating summary.
 */
export async function submitUserRating(
  stars: StarValue,
  signal?: AbortSignal,
): Promise<ProductRating> {
  const response = await fetch(USER_RATING_ENDPOINT, {
    method: 'PUT',
    signal,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ stars }),
  })

  return parseRatingResponse(response)
}
