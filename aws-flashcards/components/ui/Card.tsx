import type { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Use 'muted' for secondary surfaces */
  variant?: 'default' | 'muted'
}

/**
 * Base surface card. Use for all content containers.
 */
export function Card({ variant = 'default', className = '', children, ...props }: CardProps) {
  return (
    <div
      className={[
        'rounded-2xl p-6',
        variant === 'muted' ? 'bg-surface-muted' : 'bg-surface-card',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </div>
  )
}
