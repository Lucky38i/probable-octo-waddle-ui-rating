import { API_BASE_URL, DEFAULT_API_BASE_URL, resolveApiBaseUrl } from './config'

describe('resolveApiBaseUrl', () => {
  it.each([
    ['unset', undefined],
    ['empty', ''],
    ['blank', '   '],
  ])('falls back to the same-origin default when %s', (_, value) => {
    expect(resolveApiBaseUrl(value)).toBe(DEFAULT_API_BASE_URL)
  })

  it.each([
    ['https://api.example.com', 'https://api.example.com'],
    ['https://api.example.com/', 'https://api.example.com'],
    ['https://api.example.com/v1//', 'https://api.example.com/v1'],
    ['  /ratings-api  ', '/ratings-api'],
    ['/', ''],
  ])('normalises %j to %j', (value, expected) => {
    expect(resolveApiBaseUrl(value)).toBe(expected)
  })
})

it('defaults API_BASE_URL to the same origin when the variable is not set', () => {
  expect(API_BASE_URL).toBe('/api')
})
