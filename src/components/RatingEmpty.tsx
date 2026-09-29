import { FeefoAttribution } from './FeefoAttribution'
import { StarRating } from './StarRating'

interface RatingEmptyProps {
  maxRating: number
}

export function RatingEmpty({ maxRating }: RatingEmptyProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <h2 className="text-2xl font-semibold tracking-[0.2em] uppercase sm:text-[1.75rem]">
        No reviews yet
      </h2>

      <StarRating rating={0} maxRating={maxRating} className="mt-4" />

      <p className="mt-4 text-sm text-feefo-slate sm:text-base">
        This product hasn’t been rated yet. Be the first to rate it below.
      </p>

      <FeefoAttribution className="mt-5" />
    </div>
  )
}
