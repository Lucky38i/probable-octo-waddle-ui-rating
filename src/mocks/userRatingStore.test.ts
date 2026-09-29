import {
  clearUserRating,
  readUserRating,
  USER_RATING_STORAGE_KEY,
  writeUserRating,
} from './userRatingStore'

describe('userRatingStore', () => {
  it('returns null when nothing is stored', () => {
    expect(readUserRating()).toBeNull()
  })

  it('writes, reads and clears the rating', () => {
    writeUserRating(4)
    expect(localStorage.getItem(USER_RATING_STORAGE_KEY)).toBe('4')
    expect(readUserRating()).toBe(4)

    clearUserRating()
    expect(readUserRating()).toBeNull()
  })

  it.each(['0', '6', '2.5', 'banana'])('ignores an invalid stored value of %s', (value) => {
    localStorage.setItem(USER_RATING_STORAGE_KEY, value)

    expect(readUserRating()).toBeNull()
  })

  describe('when storage is unavailable', () => {
    beforeEach(() => {
      const fail = () => {
        throw new DOMException('Storage disabled', 'SecurityError')
      }
      jest.spyOn(Storage.prototype, 'getItem').mockImplementation(fail)
      jest.spyOn(Storage.prototype, 'setItem').mockImplementation(fail)
      jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(fail)
    })

    it('fails silently', () => {
      expect(readUserRating()).toBeNull()
      expect(() => writeUserRating(3)).not.toThrow()
      expect(() => clearUserRating()).not.toThrow()
    })
  })
})
