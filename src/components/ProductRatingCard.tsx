import { useRef, useState } from 'react'
import { submitUserRating } from '../api/productRating'
import { useProductRating, type ProductRatingFetcher } from '../hooks/useProductRating'
import type { StarValue } from '../types/rating'
import { cx } from '../utils/cx'
import { formatCount, getTotalReviews, pluralise } from '../utils/rating'
import { RateProduct, type UserRatingSubmitter } from './RateProduct'
import { RatingEmpty } from './RatingEmpty'
import { RatingError } from './RatingError'
import { RatingSkeleton } from './RatingSkeleton'
import { RatingSummary } from './RatingSummary'

interface ProductRatingCardProps {
  fetcher?: ProductRatingFetcher
  submitRating?: UserRatingSubmitter
  onRatingSelect?: (stars: StarValue | null) => void
  className?: string
}

export function ProductRatingCard({
  fetcher,
  submitRating = submitUserRating,
  onRatingSelect,
  className,
}: ProductRatingCardProps) {
  const { state, retry, setRating } = useProductRating(fetcher)
  const [selectedStars, setSelectedStars] = useState<StarValue | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const cardRef = useRef<HTMLElement>(null)

  const handleSelect = (stars: StarValue | null) => {
    setSelectedStars(stars)
    onRatingSelect?.(stars)

    if (state.status !== 'success') return
    if (stars === null) {
      setAnnouncement('Showing all reviews')
      return
    }
    const count = state.data.breakdown.find((entry) => entry.stars === stars)?.count ?? 0
    setAnnouncement(`Showing ${formatCount(count)} ${stars}-star ${pluralise(count, 'review')}`)
  }

  const handleRetry = () => {
    retry()
    // The retry button unmounts; keep focus inside the card rather than losing it to <body>.
    cardRef.current?.focus()
  }

  return (
    <article
      ref={cardRef}
      tabIndex={-1}
      aria-label="Product rating"
      aria-busy={state.status === 'loading'}
      className={cx(
        'w-full max-w-md rounded-2xl border border-feefo-border bg-white px-5 py-8 shadow-sm outline-none sm:px-8 sm:py-10',
        className,
      )}
    >
      {state.status === 'loading' && <RatingSkeleton />}
      {state.status === 'error' && <RatingError onRetry={handleRetry} />}
      {state.status === 'success' && (
        <>
          {getTotalReviews(state.data.breakdown) === 0 ? (
            <RatingEmpty maxRating={state.data.maxRating} />
          ) : (
            <RatingSummary
              rating={state.data}
              selectedStars={selectedStars}
              onSelect={handleSelect}
            />
          )}
          {/* Kept in the same position so it isn't remounted when the empty state becomes a summary. */}
          <RateProduct
            userRating={state.data.userRating}
            submitRating={submitRating}
            onRated={setRating}
            className="mt-8 border-t border-feefo-border pt-6"
          />
        </>
      )}
      <p aria-live="polite" aria-atomic="true" className="sr-only" data-testid="rating-announcer">
        {announcement}
      </p>
    </article>
  )
}
