import type { ReactNode } from 'react'
import { Dumbbell } from 'lucide-react'

interface HeroProps {
  /**
   * Mobile-only top bar (brand + actions). Hidden on desktop, where the
   * sidebar already carries the brand — avoids duplicate branding.
   */
  topBar?: ReactNode
  children: ReactNode
  /**
   * `banner` = full-bleed page top (Início screens); `card` = a rounded,
   * standalone hero card used inside padded lists (Academia).
   */
  variant?: 'banner' | 'card'
  /** Decorative flourish behind the content. */
  flourish?: 'glow' | 'dumbbell'
  className?: string
}

/**
 * Shared dark gradient hero. Centralises the gradient, the decorative glow and
 * the responsive top-bar treatment so every hero (student/teacher home,
 * Academia) stays visually identical.
 */
export function Hero({
  topBar,
  children,
  variant = 'banner',
  flourish = 'glow',
  className = '',
}: HeroProps) {
  const shape =
    variant === 'card'
      ? 'rounded-3xl px-5 py-5 shadow-card'
      : 'pt-safe px-6 pb-9 lg:pt-8'

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br from-ink via-ink-soft to-ink text-white ${shape} ${className}`}
    >
      {topBar && (
        <div className="flex h-14 items-center justify-between lg:hidden">
          {topBar}
        </div>
      )}

      {children}

      {flourish === 'dumbbell' && (
        <Dumbbell
          size={130}
          strokeWidth={1.5}
          aria-hidden="true"
          className="pointer-events-none absolute -right-5 top-12 text-primary/10"
        />
      )}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute rounded-full bg-primary/20 ${
          variant === 'card'
            ? '-right-8 -top-8 h-28 w-28 blur-2xl'
            : '-right-12 -top-12 h-40 w-40 blur-3xl'
        }`}
      />
    </div>
  )
}
