import { useEffect, useState } from 'react'
import { MapPin, Navigation, Maximize2, ChevronLeft } from 'lucide-react'
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
 * location and can expand to a full-screen view with a back button. When
 * `onOpen` is set, the preview also behaves as a tappable "directions" target.
 */
export function MapView({
  point,
  label,
  distance,
  height = 184,
  onOpen,
  className = '',
}: MapViewProps) {
  const [fullscreen, setFullscreen] = useState(false)

  // Close the full-screen map with Escape and lock body scroll while open.
  useEffect(() => {
    if (!fullscreen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setFullscreen(false)
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [fullscreen])

  return (
    <>
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

        {/* Expand to full screen. */}
        <button
          type="button"
          onClick={() => setFullscreen(true)}
          aria-label="Abrir mapa em tela cheia"
          className="absolute left-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-surface/90 text-content shadow-soft backdrop-blur transition-colors hover:text-primary"
        >
          <Maximize2 size={16} />
        </button>

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

      {/* Full-screen overlay with a back button. */}
      {fullscreen && (
        <div className="fixed inset-0 z-[70] flex flex-col bg-ink">
          <div className="pt-safe flex items-center gap-2 bg-ink px-3 py-3 text-white">
            <button
              type="button"
              onClick={() => setFullscreen(false)}
              aria-label="Voltar"
              className="-ml-1 flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-white/10 active:bg-white/15"
            >
              <ChevronLeft size={24} />
            </button>
            <span className="truncate font-display text-base font-bold uppercase tracking-tight">
              {label ?? 'Mapa'}
            </span>
            {distance && (
              <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold">
                <Navigation size={11} className="text-primary" /> {distance}
              </span>
            )}
          </div>

          <div className="relative flex-1">
            <iframe
              title={label ? `${label} — tela cheia` : 'Mapa em tela cheia'}
              src={osmEmbedUrl(point, 0.012)}
              className="h-full w-full border-0"
              referrerPolicy="no-referrer-when-downgrade"
            />
            {onOpen && (
              <button
                type="button"
                onClick={onOpen}
                className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-white shadow-primary transition-transform active:scale-95"
              >
                <Navigation size={16} /> Como chegar
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
}
