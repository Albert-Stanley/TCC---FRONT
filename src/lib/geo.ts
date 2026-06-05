import { useCallback, useState } from 'react'

/** A geographic point. */
export interface LatLng {
  lat: number
  lng: number
}

const EARTH_RADIUS_M = 6_371_000

/** Great-circle distance between two points, in metres. */
export function haversineMeters(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h))
}

/** Human-friendly distance: "120 m" under ~1 km, "1,4 km" above. */
export function formatDistance(meters: number): string {
  if (meters < 950) return `${Math.round(meters / 10) * 10} m`
  return `${(meters / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km`
}

/**
 * OpenStreetMap embeddable map URL (no API key) centred on `point` with a pin.
 * `span` controls the zoom — smaller = closer.
 */
export function osmEmbedUrl({ lat, lng }: LatLng, span = 0.006): string {
  const bbox = [lng - span, lat - span, lng + span, lat + span]
    .map((n) => n.toFixed(6))
    .join('%2C')
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`
}

/**
 * Opens turn-by-turn directions to `dest`. Uses the user's live location as the
 * origin when geolocation is granted, otherwise lets the maps app ask for it.
 * Defaults to walking, which suits a neighbourhood gym.
 */
export function openDirections(
  dest: LatLng,
  mode: 'walking' | 'driving' | 'transit' = 'walking',
): void {
  const launch = (origin?: LatLng) => {
    const params = new URLSearchParams({ api: '1', travelmode: mode })
    if (origin) params.set('origin', `${origin.lat},${origin.lng}`)
    params.set('destination', `${dest.lat},${dest.lng}`)
    window.open(
      `https://www.google.com/maps/dir/?${params.toString()}`,
      '_blank',
      'noopener,noreferrer',
    )
  }

  if (!('geolocation' in navigator)) return launch()
  navigator.geolocation.getCurrentPosition(
    (pos) => launch({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
    () => launch(),
    { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 },
  )
}

/** Max distance from the gym (metres) that still counts as "at the gym". */
export const CHECKIN_RADIUS_M = 150

/**
 * Promise wrapper around the Geolocation API. Resolves the current coordinates
 * or rejects with `Error('unsupported')` / a `GeolocationPositionError`.
 */
export function getCurrentPosition(
  opts: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 8000,
    maximumAge: 30_000,
  },
): Promise<LatLng> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('unsupported'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      reject,
      opts,
    )
  })
}

type GeoStatus = 'idle' | 'loading' | 'granted' | 'denied' | 'unsupported'

/**
 * Tracks the user's current location on demand. Call `request()` (e.g. from a
 * button or effect) to prompt for permission and resolve the coordinates.
 */
export function useUserLocation() {
  const [coords, setCoords] = useState<LatLng | null>(null)
  const [status, setStatus] = useState<GeoStatus>('idle')

  const request = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setStatus('unsupported')
      return
    }
    setStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setStatus('granted')
      },
      () => setStatus('denied'),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 },
    )
  }, [])

  return { coords, status, request }
}
