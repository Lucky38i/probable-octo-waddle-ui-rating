import type { StarValue } from '../types/rating'
import { isStarValue } from '../utils/rating'

/** Where the mock backend keeps the current user's rating so it survives page reloads. */
export const USER_RATING_STORAGE_KEY = 'feefo-demo:user-rating'

// Storage can throw (e.g. disabled cookies or Safari private mode); treat that as "no rating".
export function readUserRating(): StarValue | null {
  try {
    const stars = Number(localStorage.getItem(USER_RATING_STORAGE_KEY))
    return isStarValue(stars) ? stars : null
  } catch {
    return null
  }
}

export function writeUserRating(stars: StarValue): void {
  try {
    localStorage.setItem(USER_RATING_STORAGE_KEY, String(stars))
  } catch {
    // The rating still applies to this response; it just won't persist.
  }
}

export function clearUserRating(): void {
  try {
    localStorage.removeItem(USER_RATING_STORAGE_KEY)
  } catch {
    // Nothing to clear.
  }
}
