import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  /** Adds press feedback — use when the whole card is tappable. */
  interactive?: boolean
}

/** White rounded card with a hairline border and a soft, layered shadow. */
export function Card({
  children,
  className = '',
  interactive = false,
  ...props
}: CardProps) {
  return (
    <div
      className={`rounded-3xl border border-line bg-surface p-4 shadow-soft ${
        interactive
          ? 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card active:scale-[0.99]'
          : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
