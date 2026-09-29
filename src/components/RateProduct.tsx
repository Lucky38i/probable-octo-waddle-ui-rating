import { CircleAlert, CircleCheck, LoaderCircle, Star } from 'lucide-react'
import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { STAR_VALUES, type ProductRating, type StarValue } from '../types/rating'
import { cx } from '../utils/cx'
import { getRatingLabel, isStarValue, pluralise } from '../utils/rating'

export type UserRatingSubmitter = (stars: StarValue, signal: AbortSignal) => Promise<ProductRating>

type SubmitStatus = 'idle' | 'submitting' | 'submitted' | 'error'

interface RateProductProps {
  /** The user's saved rating from the API, if any. */
  userRating: StarValue | null
  submitRating: UserRatingSubmitter
  /** Called with the updated summary once the rating has been saved. */
  onRated: (rating: ProductRating) => void
  className?: string
}

const starsText = (stars: number) => `${stars} ${pluralise(stars, 'star')}`

export function RateProduct({ userRating, submitRating, onRated, className }: RateProductProps) {
  const legendId = useId()
  const radioName = useId()
  const [selected, setSelected] = useState<StarValue | null>(userRating)
  const [hovered, setHovered] = useState<StarValue | null>(null)
  const [status, setStatus] = useState<SubmitStatus>('idle')
  const [confirmation, setConfirmation] = useState('')
  const controllerRef = useRef<AbortController | null>(null)

  useEffect(() => () => controllerRef.current?.abort(), [])

  const isSubmitting = status === 'submitting'
  const canSubmit = selected !== null && selected !== userRating && !isSubmitting
  const preview = hovered ?? selected

  const handleSelect = (stars: StarValue) => {
    setSelected(stars)
    setStatus('idle')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSubmit) return

    const controller = new AbortController()
    controllerRef.current = controller
    setStatus('submitting')

    try {
      const updated = await submitRating(selected, controller.signal)
      if (controller.signal.aborted) return
      setConfirmation(
        userRating === null
          ? `Thanks! Your ${selected}-star rating has been submitted.`
          : `Thanks! Your rating has been updated to ${starsText(selected)}.`,
      )
      setStatus('submitted')
      onRated(updated)
    } catch {
      if (!controller.signal.aborted) setStatus('error')
    }
  }

  let statusMessage = ''
  if (status === 'submitting') statusMessage = 'Submitting your rating…'
  else if (status === 'submitted') statusMessage = confirmation
  else if (userRating !== null) statusMessage = `You rated this product ${starsText(userRating)}.`

  return (
    <form
      onSubmit={handleSubmit}
      aria-labelledby={legendId}
      aria-busy={isSubmitting}
      className={cx('flex flex-col items-center gap-3 text-center', className)}
    >
      <fieldset disabled={isSubmitting} className="flex flex-col items-center gap-2">
        <legend id={legendId} className="text-base font-semibold sm:text-lg">
          Rate this product
        </legend>

        {/* Hover only previews a rating; selection still happens via the native radios. */}
        <div
          role="presentation"
          className="mt-2 flex items-center gap-1"
          onMouseOver={(event) => {
            const option = (event.target as HTMLElement).closest<HTMLElement>('[data-star-option]')
            const stars = Number(option?.dataset.starOption)
            if (isStarValue(stars)) setHovered(stars)
          }}
          onMouseLeave={() => setHovered(null)}
          onFocus={() => setHovered(null)}
        >
          {STAR_VALUES.map((stars) => {
            const isFilled = preview !== null && stars <= preview
            return (
              <label
                key={stars}
                data-star-option={stars}
                data-filled={isFilled}
                className="grid size-10 cursor-pointer place-items-center rounded-md transition-transform hover:scale-110 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-feefo-ink has-disabled:cursor-not-allowed motion-reduce:transition-none motion-reduce:hover:scale-100 min-[360px]:size-11"
              >
                <input
                  type="radio"
                  name={radioName}
                  value={stars}
                  checked={selected === stars}
                  onChange={() => handleSelect(stars)}
                  className="sr-only"
                />
                <Star
                  aria-hidden="true"
                  focusable="false"
                  strokeWidth={1.5}
                  className={cx(
                    'size-8 transition-colors motion-reduce:transition-none',
                    isFilled
                      ? 'fill-feefo-yellow text-feefo-yellow-dark'
                      : 'fill-transparent text-feefo-slate',
                  )}
                />
                <span className="sr-only">
                  {starsText(stars)}, {getRatingLabel(stars)}
                </span>
              </label>
            )
          })}
        </div>

        <p aria-hidden="true" className="min-h-5 text-sm font-medium text-feefo-slate">
          {preview === null ? 'Select a rating' : getRatingLabel(preview)}
        </p>
      </fieldset>

      <button
        type="submit"
        disabled={!canSubmit}
        className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg bg-feefo-ink px-5 text-sm font-semibold text-white transition hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-feefo-ink disabled:cursor-not-allowed disabled:bg-feefo-track disabled:text-feefo-slate"
      >
        {isSubmitting && (
          <LoaderCircle
            aria-hidden="true"
            focusable="false"
            className="size-4 motion-safe:animate-spin"
          />
        )}
        {isSubmitting ? 'Submitting…' : userRating === null ? 'Submit rating' : 'Update rating'}
      </button>

      <p
        role="status"
        data-testid="rating-submission-status"
        className={cx(
          'flex min-h-5 items-center gap-1.5 text-sm',
          status === 'submitted' ? 'font-semibold text-feefo-success' : 'text-feefo-slate',
        )}
      >
        {status === 'submitted' && (
          <CircleCheck aria-hidden="true" focusable="false" className="size-4 shrink-0" />
        )}
        {statusMessage}
      </p>

      {status === 'error' && (
        <p role="alert" className="flex items-center gap-1.5 text-sm font-medium text-feefo-error">
          <CircleAlert aria-hidden="true" focusable="false" className="size-4 shrink-0" />
          We couldn’t submit your rating. Please try again.
        </p>
      )}
    </form>
  )
}
