import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  /** Optional element rendered inside the field on the right (e.g. an eye toggle). */
  rightSlot?: ReactNode
  /** Optional element rendered inside the field on the left (e.g. an icon). */
  leftSlot?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, rightSlot, leftSlot, className = '', id, ...props },
  ref,
) {
  const inputId = id ?? props.name

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {leftSlot && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-muted">
            {leftSlot}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`h-13 w-full rounded-2xl border bg-surface text-[15px] text-content shadow-soft transition-all duration-200 placeholder:text-neutral-400 focus:outline-none focus:ring-4 ${
            leftSlot ? 'pl-11' : 'pl-4'
          } ${rightSlot ? 'pr-12' : 'pr-4'} ${
            error
              ? 'border-primary focus:border-primary focus:ring-primary/15'
              : 'border-line focus:border-primary focus:ring-primary/10'
          } ${className}`}
          {...props}
        />
        {rightSlot && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-4 text-muted">
            {rightSlot}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-xs font-medium text-primary">{error}</p>
      )}
    </div>
  )
})
