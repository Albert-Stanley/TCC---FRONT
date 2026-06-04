import emblem from '@/assets/brand/krav-emblem.png'

/**
 * Krav Magá emblem presented as a crisp, app-icon-style rounded tile. The
 * source artwork is white-on-black, so wrapping it in a dark rounded tile (with
 * a hairline ring) makes it read as an intentional brand mark on *any* surface —
 * light or dark — instead of a bare, muddy image.
 */
export function Logo({
  size = 40,
  className = '',
  rounded = 'rounded-xl',
  ring = true,
}: {
  size?: number
  className?: string
  rounded?: string
  ring?: boolean
}) {
  return (
    <span
      className={`inline-flex shrink-0 overflow-hidden bg-ink ${rounded} ${
        ring ? 'ring-1 ring-white/10' : ''
      } ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={emblem}
        alt="Krav Magá"
        className="h-full w-full object-cover"
        draggable={false}
      />
    </span>
  )
}
