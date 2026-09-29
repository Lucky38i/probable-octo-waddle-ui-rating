import { useId, useRef, type KeyboardEvent } from 'react'
import type { RatingBreakdownEntry, StarValue } from '../types/rating'
import { cx } from '../utils/cx'
import { getTotalReviews, sortBreakdownDescending } from '../utils/rating'
import { RatingBreakdownRow } from './RatingBreakdownRow'

interface RatingBreakdownProps {
  breakdown: readonly RatingBreakdownEntry[]
  selectedStars: StarValue | null
  onSelect: (stars: StarValue | null) => void
  className?: string
}

const NAVIGATION_KEYS = new Set(['ArrowDown', 'ArrowUp', 'Home', 'End'])

export function RatingBreakdown({
  breakdown,
  selectedStars,
  onSelect,
  className,
}: RatingBreakdownProps) {
  const headingId = useId()
  const instructionsId = useId()
  const listRef = useRef<HTMLUListElement>(null)
  const rows = sortBreakdownDescending(breakdown)
  const totalReviews = getTotalReviews(rows)

  const handleToggle = (stars: StarValue) => onSelect(selectedStars === stars ? null : stars)

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!NAVIGATION_KEYS.has(event.key)) return
    const buttons = Array.from(
      listRef.current?.querySelectorAll<HTMLButtonElement>('button[data-rating-row]') ?? [],
    )
    const currentIndex = buttons.indexOf(event.currentTarget)
    if (currentIndex === -1) return
    event.preventDefault()

    const lastIndex = buttons.length - 1
    const nextIndex = {
      ArrowDown: currentIndex === lastIndex ? 0 : currentIndex + 1,
      ArrowUp: currentIndex === 0 ? lastIndex : currentIndex - 1,
      Home: 0,
      End: lastIndex,
    }[event.key as 'ArrowDown' | 'ArrowUp' | 'Home' | 'End']

    buttons[nextIndex]?.focus()
  }

  return (
    <section
      aria-labelledby={headingId}
      aria-describedby={instructionsId}
      className={cx('w-full', className)}
    >
      <h3 id={headingId} className="sr-only">
        Rating breakdown from {totalReviews} reviews
      </h3>
      <p id={instructionsId} className="sr-only">
        Select a star rating to filter reviews. Use the arrow keys to move between ratings.
      </p>
      <ul ref={listRef} className="flex flex-col gap-1">
        {rows.map((entry) => (
          <li key={entry.stars}>
            <RatingBreakdownRow
              entry={entry}
              totalReviews={totalReviews}
              isSelected={selectedStars === entry.stars}
              isDimmed={selectedStars !== null && selectedStars !== entry.stars}
              onToggle={handleToggle}
              onKeyDown={handleKeyDown}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}
