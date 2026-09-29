import { cx } from './cx'

describe('cx', () => {
  it('joins truthy class names and drops falsy values', () => {
    expect(cx('a', false, null, undefined, '', 'b')).toBe('a b')
  })
})
