import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
}

/**
 * Accessible text input with associated label, error, and hint support.
 * Always renders a <label> — never use placeholder as the only label.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id, className = '', ...props }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-')
    const errorId = `${inputId}-error`
    const hintId = `${inputId}-hint`

    const describedBy = [
      error ? errorId : null,
      hint ? hintId : null,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-text-primary"
        >
          {label}
        </label>

        <input
          ref={ref}
          id={inputId}
          aria-describedby={describedBy || undefined}
          aria-invalid={error ? 'true' : undefined}
          className={[
            'bg-surface-card border rounded-xl px-4 py-2.5 text-text-primary text-sm',
            'placeholder:text-text-muted',
            'transition-colors duration-150',
            error
              ? 'border-danger focus:ring-danger'
              : 'border-surface-muted focus:border-primary focus:ring-primary',
            'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface',
            className,
          ].join(' ')}
          {...props}
        />

        {hint && !error && (
          <p id={hintId} className="text-xs text-text-muted">
            {hint}
          </p>
        )}

        {error && (
          <p id={errorId} role="alert" className="text-xs text-danger">
            {error}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
