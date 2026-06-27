interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  label?: string
}

const sizeClasses = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }

/**
 * Accessible loading spinner.
 * Always include a label for screen readers.
 */
export function Spinner({ size = 'md', label = 'Loading…' }: SpinnerProps) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className="inline-flex">
      <span
        className={[
          sizeClasses[size],
          'border-2 border-primary border-t-transparent rounded-full animate-spin',
        ].join(' ')}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </div>
  )
}
