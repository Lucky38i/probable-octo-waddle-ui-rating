export function RatingSkeleton() {
  return (
    <div role="status" className="flex flex-col items-center">
      <span className="sr-only">Loading product rating…</span>
      <div
        aria-hidden="true"
        data-testid="rating-skeleton"
        className="flex w-full flex-col items-center motion-safe:animate-pulse"
      >
        <div className="h-8 w-44 rounded bg-feefo-track" />
        <div className="mt-4 flex gap-1.5">
          {Array.from({ length: 5 }, (_, index) => (
            <div
              key={index}
              className="size-10 rounded-md bg-feefo-track min-[360px]:size-11 sm:size-12"
            />
          ))}
        </div>
        <div className="mt-4 h-4 w-28 rounded bg-feefo-track" />
        <div className="mt-5 h-7 w-52 rounded bg-feefo-track" />
        <div className="mt-8 flex w-full flex-col gap-4 sm:mt-10">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="h-6 w-full rounded bg-feefo-track" />
          ))}
        </div>
      </div>
    </div>
  )
}
