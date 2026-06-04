interface AvatarProps {
  /** Full name; the first initial is shown. */
  name?: string
  /** Tailwind size classes (default h-12 w-12). */
  size?: string
  /** Use the red accent instead of ink (e.g. header avatar in mockups). */
  accent?: boolean
  className?: string
}

/** Circular avatar with a bold white initial on an ink (or red) gradient. */
export function Avatar({
  name,
  size = 'h-12 w-12 text-lg',
  accent = false,
  className = '',
}: AvatarProps) {
  const initial = (name?.trim()?.[0] ?? '?').toUpperCase()
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white shadow-soft ring-2 ring-surface ${
        accent
          ? 'bg-gradient-to-br from-primary to-primary-dark'
          : 'bg-gradient-to-br from-ink-soft to-ink'
      } ${size} ${className}`}
    >
      {initial}
    </span>
  )
}
