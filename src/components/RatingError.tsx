import { CircleAlert, RotateCw } from 'lucide-react'

interface RatingErrorProps {
  onRetry: () => void
}

export function RatingError({ onRetry }: RatingErrorProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <CircleAlert aria-hidden="true" focusable="false" className="size-10 text-feefo-error" />
      <div role="alert">
        <p className="font-semibold">We couldn’t load the product rating.</p>
        <p className="mt-1 text-sm text-feefo-slate">Please check your connection and try again.</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg bg-feefo-ink px-5 text-sm font-semibold text-white transition hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-feefo-ink"
      >
        <RotateCw aria-hidden="true" focusable="false" className="size-4" />
        Try again
      </button>
    </div>
  )
}
