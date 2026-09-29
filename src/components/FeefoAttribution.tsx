import feefoLogo from '../assets/feefo-logo.svg'
import { cx } from '../utils/cx'

export function FeefoAttribution({ className }: { className?: string }) {
  return (
    <p
      className={cx(
        'flex items-center gap-3 text-lg font-medium text-feefo-slate sm:text-xl',
        className,
      )}
    >
      Product Rating
      <img src={feefoLogo} alt="feefo" width={96} height={25} className="h-6 w-auto sm:h-7" />
    </p>
  )
}
