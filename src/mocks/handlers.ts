import { delay, http, HttpResponse } from 'msw'
import { PRODUCT_RATING_ENDPOINT, USER_RATING_ENDPOINT } from '../api/productRating'
import type { ProductRatingResponse } from '../types/rating'
import { isStarValue } from '../utils/rating'
import { applyUserRating } from './applyUserRating'
import {
  mockProductRating,
  mockProductRatingNoReviews,
  mockProductRatingWithoutAverage,
} from './data'
import { readUserRating, writeUserRating } from './userRatingStore'

const serverError = () => HttpResponse.json({ message: 'Internal server error' }, { status: 500 })

/** GET + PUT handlers that behave like a backend holding `base` plus the user's own rating. */
export function createRatingHandlers(
  base: ProductRatingResponse,
  { getDelayMs = 0 }: { getDelayMs?: number } = {},
) {
  return [
    http.get(PRODUCT_RATING_ENDPOINT, async () => {
      if (getDelayMs > 0) await delay(getDelayMs)
      return HttpResponse.json(applyUserRating(base, readUserRating()))
    }),
    http.put(USER_RATING_ENDPOINT, async ({ request }) => {
      await delay()
      const body: unknown = await request.json().catch(() => null)
      const stars = typeof body === 'object' && body !== null && 'stars' in body && body.stars

      if (!isStarValue(stars)) {
        return HttpResponse.json(
          { message: '`stars` must be a whole number from 1 to 5' },
          { status: 400 },
        )
      }

      writeUserRating(stars)
      return HttpResponse.json(applyUserRating(base, stars))
    }),
  ]
}

export const productRatingHandlers = {
  success: createRatingHandlers(mockProductRating),
  slow: createRatingHandlers(mockProductRating, { getDelayMs: 1500 }),
  withoutAverage: createRatingHandlers(mockProductRatingWithoutAverage),
  noReviews: createRatingHandlers(mockProductRatingNoReviews),
  error: [http.get(PRODUCT_RATING_ENDPOINT, serverError)],
  errorOnce: [http.get(PRODUCT_RATING_ENDPOINT, serverError, { once: true })],
  invalid: [http.get(PRODUCT_RATING_ENDPOINT, () => HttpResponse.json({ unexpected: true }))],
  submitError: [http.put(USER_RATING_ENDPOINT, serverError)],
}

export const handlers = productRatingHandlers.success

export type MockScenario =
  'success' | 'slow' | 'error' | 'no-average' | 'no-reviews' | 'submit-error'

/**
 * Handlers for a named scenario. Lets Cypress (and developers) exercise
 * loading/error states and API variations via `?mockScenario=<scenario>` on the dev server.
 */
export function getScenarioHandlers(scenario: string | null) {
  switch (scenario) {
    case 'slow':
      return productRatingHandlers.slow
    case 'error':
      return productRatingHandlers.error
    case 'no-average':
      return productRatingHandlers.withoutAverage
    case 'no-reviews':
      return productRatingHandlers.noReviews
    case 'submit-error':
      // Earlier handlers take precedence, so the failing PUT wins over the working one.
      return [...productRatingHandlers.submitError, ...handlers]
    default:
      return handlers
  }
}
