interface ProgressBarProps {
  /** 0–100 */
  value: number
  label?: string
  showValue?: boolean
  color?: 'primary' | 'success' | 'warning' | 'danger'
}

const colorClasses = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
}

/**
 * Accessible linear progress bar.
 */
export function ProgressBar({
  value,
  label,
  showValue = false,
  color = 'primary',
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-xs text-text-muted">{label}</span>}
          {showValue && (
            <span className="text-xs font-medium text-text-primary">{clamped}%</span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? 'Progress'}
        className="h-2 w-full bg-surface-muted rounded-full overflow-hidden"
      >
        <div
          className={['h-full rounded-full transition-all duration-500', colorClasses[color]].join(' ')}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}
