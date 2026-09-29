import {
  calculateAverageRating,
  formatCount,
  formatPercentage,
  formatRating,
  getPercentage,
  getRatingLabel,
  getStarFillPercentages,
  getTotalReviews,
  isStarValue,
  pluralise,
  resolveAverageRating,
  roundRating,
  sortBreakdownDescending,
} from './rating'
import type { RatingBreakdownEntry } from '../types/rating'

describe('getRatingLabel', () => {
  it.each([
    [5, 'Excellent'],
    [4.6, 'Excellent'],
    [4.5, 'Excellent'],
    [4.49, 'Good'],
    [3.5, 'Good'],
    [3, 'Average'],
    [2.5, 'Average'],
    [2, 'Poor'],
    [1.5, 'Poor'],
    [1, 'Bad'],
    [0, 'Bad'],
  ])('labels %s as %s', (rating, label) => {
    expect(getRatingLabel(rating)).toBe(label)
  })
})

describe('getStarFillPercentages', () => {
  it('fills whole stars and a partial final star', () => {
    expect(getStarFillPercentages(4.6)).toEqual([100, 100, 100, 100, 60])
  })

  it('handles whole numbers', () => {
    expect(getStarFillPercentages(3)).toEqual([100, 100, 100, 0, 0])
  })

  it('avoids floating point noise', () => {
    expect(getStarFillPercentages(2.3)).toEqual([100, 100, 30, 0, 0])
  })

  it('clamps out-of-range and invalid ratings', () => {
    expect(getStarFillPercentages(7)).toEqual([100, 100, 100, 100, 100])
    expect(getStarFillPercentages(-2)).toEqual([0, 0, 0, 0, 0])
    expect(getStarFillPercentages(Number.NaN)).toEqual([0, 0, 0, 0, 0])
  })

  it('supports a custom maximum rating', () => {
    expect(getStarFillPercentages(2.5, 3)).toEqual([100, 100, 50])
  })
})

describe('formatting', () => {
  it('formats ratings to one decimal place', () => {
    expect(formatRating(4.6)).toBe('4.6')
    expect(formatRating(5)).toBe('5.0')
    expect(formatRating(4.608)).toBe('4.6')
  })

  it('formats counts with thousands separators', () => {
    expect(formatCount(952)).toBe('952')
    expect(formatCount(12345)).toBe('12,345')
  })

  it.each([
    [77.27, '77%'],
    [0.4, '<1%'],
    [0, '0%'],
    [100, '100%'],
  ])('formats %s percent as %s', (value, expected) => {
    expect(formatPercentage(value)).toBe(expected)
  })
})

describe('getPercentage', () => {
  it('calculates a share of the total', () => {
    expect(getPercentage(952, 1232)).toBeCloseTo(77.27, 2)
  })

  it('returns 0 when there are no reviews', () => {
    expect(getPercentage(5, 0)).toBe(0)
  })

  it('never exceeds 100', () => {
    expect(getPercentage(20, 10)).toBe(100)
  })
})

describe('breakdown helpers', () => {
  const breakdown: RatingBreakdownEntry[] = [
    { stars: 1, count: 40 },
    { stars: 5, count: 952 },
    { stars: 3, count: 55 },
  ]

  it('sums the total number of reviews', () => {
    expect(getTotalReviews(breakdown)).toBe(1047)
    expect(getTotalReviews([])).toBe(0)
  })

  it('sorts from highest to lowest star without mutating the input', () => {
    const sorted = sortBreakdownDescending(breakdown)
    expect(sorted.map((entry) => entry.stars)).toEqual([5, 3, 1])
    expect(breakdown[0]?.stars).toBe(1)
  })
})

describe('pluralise', () => {
  it('returns the singular form for one', () => {
    expect(pluralise(1, 'star')).toBe('star')
  })

  it('returns the default or custom plural otherwise', () => {
    expect(pluralise(0, 'review')).toBe('reviews')
    expect(pluralise(2, 'person', 'people')).toBe('people')
  })
})

describe('roundRating', () => {
  it.each([
    [4.608, 4.6],
    [4.45, 4.5],
    [3.7667, 3.8],
    [5, 5],
    [0, 0],
  ])('rounds %s to %s', (value, expected) => {
    expect(roundRating(value)).toBe(expected)
  })
})

describe('calculateAverageRating', () => {
  it('weights each star value by its review count', () => {
    const breakdown: RatingBreakdownEntry[] = [
      { stars: 5, count: 952 },
      { stars: 4, count: 171 },
      { stars: 3, count: 55 },
      { stars: 2, count: 14 },
      { stars: 1, count: 40 },
    ]

    expect(calculateAverageRating(breakdown)).toBeCloseTo(5677 / 1232, 10)
  })

  it('is not a simple mean of the star values', () => {
    const breakdown: RatingBreakdownEntry[] = [
      { stars: 5, count: 9 },
      { stars: 1, count: 1 },
    ]

    expect(calculateAverageRating(breakdown)).toBe(4.6)
  })

  it('ignores star values with no reviews', () => {
    expect(
      calculateAverageRating([
        { stars: 4, count: 10 },
        { stars: 1, count: 0 },
      ]),
    ).toBe(4)
  })

  it('returns 0 when there are no reviews', () => {
    expect(calculateAverageRating([])).toBe(0)
    expect(calculateAverageRating([{ stars: 5, count: 0 }])).toBe(0)
  })
})

describe('resolveAverageRating', () => {
  const breakdown: RatingBreakdownEntry[] = [
    { stars: 5, count: 120 },
    { stars: 4, count: 80 },
    { stars: 3, count: 40 },
    { stars: 2, count: 30 },
    { stars: 1, count: 30 },
  ]

  it('prefers the average supplied by the API', () => {
    expect(resolveAverageRating({ averageRating: 4.2, maxRating: 5, breakdown })).toBe(4.2)
  })

  it('rounds the supplied average to one decimal place', () => {
    expect(resolveAverageRating({ averageRating: 4.46, maxRating: 5, breakdown })).toBe(4.5)
  })

  it('accepts supplied averages at the boundaries', () => {
    expect(resolveAverageRating({ averageRating: 0, maxRating: 5, breakdown })).toBe(0)
    expect(resolveAverageRating({ averageRating: 5, maxRating: 5, breakdown })).toBe(5)
  })

  it.each([
    ['missing', undefined],
    ['null', null],
    ['above the maximum', 7],
    ['negative', -1],
  ])('calculates from the breakdown when the average is %s', (_, averageRating) => {
    expect(resolveAverageRating({ averageRating, maxRating: 5, breakdown })).toBe(3.8)
  })

  it('returns 0 when there is no average and no reviews', () => {
    expect(resolveAverageRating({ maxRating: 5, breakdown: [] })).toBe(0)
  })
})

describe('isStarValue', () => {
  it.each([1, 2, 3, 4, 5])('accepts %s', (value) => {
    expect(isStarValue(value)).toBe(true)
  })

  it.each([0, 6, 2.5, -1, Number.NaN, '4', null, undefined])('rejects %s', (value) => {
    expect(isStarValue(value)).toBe(false)
  })
})
