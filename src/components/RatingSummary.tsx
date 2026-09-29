import type { ProductRating, StarValue } from '../types/rating'
import { formatRating, getRatingLabel } from '../utils/rating'
import { FeefoAttribution } from './FeefoAttribution'
import { RatingBreakdown } from './RatingBreakdown'
import { StarRating } from './StarRating'

interface RatingSummaryProps {
  rating: ProductRating
  selectedStars: StarValue | null
  onSelect: (stars: StarValue | null) => void
}

export function RatingSummary({ rating, selectedStars, onSelect }: RatingSummaryProps) {
  const { averageRating, maxRating, breakdown } = rating

  return (
    <div className="flex flex-col items-center text-center">
      <h2 className="text-2xl font-semibold tracking-[0.2em] uppercase sm:text-[1.75rem]">
        {getRatingLabel(averageRating)}
      </h2>

      <StarRating rating={averageRating} maxRating={maxRating} className="mt-4" />

      <p className="mt-4 text-sm font-semibold tracking-[0.12em] text-feefo-slate uppercase sm:text-base">
        <span className="sr-only">Average rating: </span>
        {formatRating(averageRating)} out of {maxRating}
      </p>

      <FeefoAttribution className="mt-5" />

      <RatingBreakdown
        breakdown={breakdown}
        selectedStars={selectedStars}
        onSelect={onSelect}
        className="mt-8 sm:mt-10"
      />
    </div>
  )
}
