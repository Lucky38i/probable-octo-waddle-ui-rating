import { Star } from 'lucide-react'
import { useEffect, useId, useState, type KeyboardEvent } from 'react'
import type { RatingBreakdownEntry, StarValue } from '../types/rating'
import { cx } from '../utils/cx'
import { formatCount, formatPercentage, getPercentage, pluralise } from '../utils/rating'

const isFocusVisible = (element: Element) => {
  try {
    return element.matches(':focus-visible')
  } catch {
    return true
  }
}

interface RatingBreakdownRowProps {
  entry: RatingBreakdownEntry
  totalReviews: number
  isSelected: boolean
  isDimmed: boolean
  onToggle: (stars: StarValue) => void
  onKeyDown?: (event: KeyboardEvent<HTMLButtonElement>) => void
}

export function RatingBreakdownRow({
  entry,
  totalReviews,
  isSelected,
  isDimmed,
  onToggle,
  onKeyDown,
}: RatingBreakdownRowProps) {
  const { stars, count } = entry
  const tooltipId = useId()
  const [isHovered, setIsHovered] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const isTooltipVisible = (isHovered || isFocused) && !isDismissed

  const percentage = getPercentage(count, totalReviews)
  const barWidth = count > 0 ? Math.max(percentage, 1) : 0
  const accessibleName = `${stars} ${pluralise(stars, 'star')}, ${formatCount(count)} ${pluralise(count, 'review')}`

  // WCAG 1.4.13: tooltip must be dismissible without moving pointer or focus.
  useEffect(() => {
    if (!isTooltipVisible) return
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setIsDismissed(true)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isTooltipVisible])

  return (
    // Hover is tracked on the wrapper so the tooltip stays open while hovered (WCAG 1.4.13).
    <div
      role="presentation"
      className="relative"
      onMouseEnter={() => {
        setIsHovered(true)
        setIsDismissed(false)
      }}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        type="button"
        data-rating-row={stars}
        aria-label={accessibleName}
        aria-pressed={isSelected}
        aria-describedby={tooltipId}
        onClick={() => onToggle(stars)}
        onKeyDown={onKeyDown}
        onFocus={(event) => {
          // Only keyboard focus opens the tooltip; after a mouse click hover controls it.
          if (!isFocusVisible(event.currentTarget)) return
          setIsFocused(true)
          setIsDismissed(false)
        }}
        onBlur={() => setIsFocused(false)}
        className={cx(
          'grid min-h-10 w-full cursor-pointer grid-cols-[2.25rem_1fr_3rem] items-center gap-2 rounded-md px-2 py-1.5 text-left transition sm:gap-3',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-feefo-ink',
          isSelected ? 'bg-feefo-yellow-soft ring-1 ring-feefo-yellow' : 'hover:bg-neutral-100',
        )}
      >
        <span className="flex items-center gap-1 text-sm font-medium text-feefo-slate">
          {stars}
          <Star
            aria-hidden="true"
            focusable="false"
            className="size-4 text-feefo-muted"
            fill="currentColor"
            strokeWidth={0}
          />
        </span>
        <span
          aria-hidden="true"
          className="h-2.5 overflow-hidden rounded-xs bg-feefo-track sm:h-3"
          data-testid="rating-bar-track"
        >
          <span
            className={cx(
              'block h-full bg-feefo-yellow transition-[width,opacity] duration-500 motion-reduce:transition-none',
              isDimmed && 'opacity-40',
            )}
            style={{ width: `${barWidth}%` }}
            data-testid="rating-bar-fill"
          />
        </span>
        <span className="text-right text-sm text-feefo-slate tabular-nums">
          {formatCount(count)}
        </span>
      </button>

      <span
        id={tooltipId}
        role="tooltip"
        className={cx(
          'absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 rounded-md bg-feefo-ink px-2.5 py-1 text-xs font-medium whitespace-nowrap text-white shadow-lg transition-opacity motion-reduce:transition-none',
          "after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-feefo-ink after:content-['']",
          isTooltipVisible ? 'visible opacity-100' : 'invisible opacity-0',
        )}
      >
        {formatPercentage(percentage)} of reviews
      </span>
    </div>
  )
}
