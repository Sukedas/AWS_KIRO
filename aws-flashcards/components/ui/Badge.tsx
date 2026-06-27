import type { HTMLAttributes } from 'react'

type BadgeVariant =
  | 'default'
  | 'easy'
  | 'medium'
  | 'hard'
  | 'ai'
  | 'category'
  | 'level'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  label: string
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-surface-muted text-text-muted',
  easy: 'bg-success/20 text-success border border-success/30',
  medium: 'bg-warning/20 text-warning border border-warning/30',
  hard: 'bg-danger/20 text-danger border border-danger/30',
  ai: 'bg-ai-badge/20 text-ai-badge border border-ai-badge/30',
  category: 'bg-primary/20 text-primary border border-primary/30',
  level: 'bg-surface-muted text-text-primary border border-surface-muted',
}

/**
 * Small pill label for difficulty, AI indicator, categories, and learning levels.
 */
export function Badge({ variant = 'default', label, className = '', ...props }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variantClasses[variant],
        className,
      ].join(' ')}
      {...props}
    >
      {label}
    </span>
  )
}
