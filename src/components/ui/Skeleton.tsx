import { Card } from './Card'

/** A single shimmering placeholder block (theme-aware via the content token). */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-content/10 ${className}`} />
}

/** Placeholder shaped like an avatar + two text lines + a trailing pill. */
export function SkeletonRow() {
  return (
    <Card className="flex items-center gap-3">
      <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="h-7 w-16 rounded-full" />
    </Card>
  )
}

/**
 * A loading list of placeholder rows. Announced politely to assistive tech via
 * `role="status"`, with the decorative rows hidden from the accessibility tree.
 */
export function SkeletonList({
  rows = 3,
  className = '',
}: {
  rows?: number
  className?: string
}) {
  return (
    <div role="status" aria-live="polite" className={`flex flex-col gap-3 ${className}`}>
      <span className="sr-only">Carregando…</span>
      <div aria-hidden="true" className="flex flex-col gap-3">
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    </div>
  )
}
