import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'dark' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  loading?: boolean
  children: ReactNode
}

const base =
  'group relative w-full h-13 inline-flex items-center justify-center gap-2 rounded-full px-6 text-[15px] font-bold tracking-tight select-none transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:opacity-50 disabled:pointer-events-none'

const variants: Record<Variant, string> = {
  primary:
    'bg-primary text-white shadow-primary hover:bg-primary-dark active:bg-primary-dark',
  dark: 'bg-ink text-white shadow-soft hover:bg-ink-soft active:bg-ink-soft',
  secondary:
    'bg-surface text-content border border-line shadow-soft hover:border-content/25 hover:bg-canvas active:bg-canvas',
  ghost: 'bg-transparent text-muted hover:bg-canvas hover:text-content',
}

export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span
          aria-label="Carregando"
          className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : (
        children
      )}
    </button>
  )
}
