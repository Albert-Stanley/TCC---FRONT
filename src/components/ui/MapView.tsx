import { MapPin, Navigation } from 'lucide-react'
import { osmEmbedUrl, type LatLng } from '@/lib/geo'

interface MapViewProps {
  /** Point to centre the map on (the pin). */
  point: LatLng
  /** Caption shown on a chip over the map (e.g. the gym name). */
  label?: string
  /** Short distance string ("120 m") shown top-right when provided. */
  distance?: string
  /** Map height in pixels. */
  height?: number
  /** Tapping anywhere on the map triggers this (used for directions). */
  onOpen?: () => void
  className?: string
}

/**
 * Lightweight, key-less map preview backed by OpenStreetMap. Renders a pinned
 * location and, when `onOpen` is set, behaves as a big tappable target that
 * launches directions. Used on the student home and check-in screens.
 */
export function MapView({
  point,
  label,
  distance,
  height = 184,
  onOpen,
  className = '',
}: MapViewProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-line shadow-soft ${className}`}
      style={{ height }}
    >
      <iframe
        title={label ?? 'Mapa da academia'}
        src={osmEmbedUrl(point)}
        className="h-full w-full border-0 dark:opacity-90"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />

      {/* Tap layer: covers the map so the whole preview opens directions. */}
      {onOpen && (
        <button
          type="button"
          onClick={onOpen}
          aria-label="Como chegar"
          className="group absolute inset-0 flex items-center justify-center bg-ink/0 transition-colors hover:bg-ink/10"
        >
          <span className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-white opacity-0 shadow-primary transition-opacity group-hover:opacity-100">
            <Navigation size={15} /> Como chegar
          </span>
        </button>
      )}

      {label && (
        <span className="pointer-events-none absolute bottom-3 left-3 inline-flex max-w-[70%] items-center gap-1.5 rounded-full bg-ink/85 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
          <MapPin size={13} className="shrink-0 text-primary" />
          <span className="truncate">{label}</span>
        </span>
      )}

      {distance && (
        <span className="pointer-events-none absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-surface/90 px-2.5 py-1 text-[11px] font-bold text-content shadow-soft backdrop-blur">
          <Navigation size={11} className="text-primary" /> {distance}
        </span>
      )}
    </div>
  )
}
