import { Star } from 'lucide-react'
import { cx } from '../utils/cx'
import { getStarFillPercentages } from '../utils/rating'

interface StarRatingProps {
  rating: number
  maxRating?: number
  /** Accessible label. When omitted the stars are treated as decorative. */
  label?: string
  className?: string
}

export function StarRating({ rating, maxRating = 5, label, className }: StarRatingProps) {
  const fills = getStarFillPercentages(rating, maxRating)
  const a11yProps = label
    ? ({ role: 'img', 'aria-label': label } as const)
    : ({ 'aria-hidden': true } as const)

  return (
    <div
      {...a11yProps}
      data-testid="star-rating"
      className={cx('flex items-center justify-center gap-1.5', className)}
    >
      {fills.map((fill, index) => (
        <span
          key={index}
          data-testid="star-tile"
          data-fill={fill}
          className="relative grid size-10 place-items-center overflow-hidden rounded-md bg-feefo-muted min-[360px]:size-11 sm:size-12"
        >
          <span
            className="absolute inset-y-0 left-0 bg-feefo-yellow"
            style={{ width: `${fill}%` }}
          />
          <Star
            aria-hidden="true"
            focusable="false"
            className="relative size-[58%] text-white"
            fill="currentColor"
            strokeWidth={1.25}
            strokeLinejoin="round"
          />
        </span>
      ))}
    </div>
  )
}
