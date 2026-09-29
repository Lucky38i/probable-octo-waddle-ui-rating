import { getScenarioHandlers, handlers, productRatingHandlers } from './handlers'

describe('getScenarioHandlers', () => {
  it.each([
    ['slow', productRatingHandlers.slow],
    ['error', productRatingHandlers.error],
    ['no-average', productRatingHandlers.withoutAverage],
    ['no-reviews', productRatingHandlers.noReviews],
    ['submit-error', [...productRatingHandlers.submitError, ...handlers]],
    [null, handlers],
    ['unknown', handlers],
  ])('returns the handlers for the %s scenario', (scenario, expected) => {
    expect(getScenarioHandlers(scenario)).toEqual(expected)
  })
})
