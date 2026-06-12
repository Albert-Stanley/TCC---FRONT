import { useCallback, useEffect, useState } from 'react'
import { api } from '@/lib/api'

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
export const CHECKIN_RADIUS_M = 500

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

/** Address fields resolved from a Brazilian CEP. */
export interface CepInfo {
  cep: string
  street?: string
  district?: string
  city?: string
  uf?: string
}

/**
 * Looks up a Brazilian postal code. Consults the Correios base through
 * BrasilAPI's CEP v2 endpoint, which is CORS-enabled for the browser (the
 * official Correios webservice has no public CORS access). Falls back to ViaCEP
 * if BrasilAPI is unavailable. Returns null when the CEP isn't found.
 */
export async function lookupCep(cep: string): Promise<CepInfo | null> {
  const digits = cep.replace(/\D/g, '')
  if (digits.length !== 8) return null

  // 1) Correios (via BrasilAPI v2).
  try {
    const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${digits}`)
    if (res.ok) {
      const d = await res.json()
      if (d?.cep) {
        return {
          cep: digits,
          street: d.street || undefined,
          district: d.neighborhood || undefined,
          city: d.city || undefined,
          uf: d.state || undefined,
        }
      }
    }
  } catch {
    // Network/CORS hiccup — fall through to ViaCEP.
  }

  // 2) ViaCEP fallback.
  try {
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
    if (!res.ok) return null
    const d = await res.json()
    if (d?.erro) return null
    return {
      cep: digits,
      street: d.logradouro || undefined,
      district: d.bairro || undefined,
      city: d.localidade || undefined,
      uf: d.uf || undefined,
    }
  } catch {
    return null
  }
}

interface NominatimHit {
  lat: string
  lon: string
  /** Present only when Nominatim resolved the exact house number (rooftop). */
  address?: { house_number?: string }
}

/** Runs a Brazil-scoped Nominatim search and returns up to 5 ranked hits. */
async function queryNominatim(params: Record<string, string>): Promise<NominatimHit[]> {
  const qs = new URLSearchParams({
    format: 'json',
    limit: '5',
    addressdetails: '1',
    countrycodes: 'br',
    ...params,
  })
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?${qs.toString()}`,
      { headers: { Accept: 'application/json' } },
    )
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? (data as NominatimHit[]) : []
  } catch {
    return []
  }
}

function toLatLng(hit?: NominatimHit): LatLng | null {
  if (!hit) return null
  const lat = parseFloat(hit.lat)
  const lng = parseFloat(hit.lon)
  return Number.isNaN(lat) || Number.isNaN(lng) ? null : { lat, lng }
}

/**
 * Picks the most precise hit. When the address carries a house number, prefer
 * a result that actually resolved to that `house_number` (rooftop-level) over
 * the street/locality centroid Nominatim returns otherwise.
 */
function pickPrecise(hits: NominatimHit[], wantHouse: boolean): LatLng | null {
  if (wantHouse) {
    const exact = hits.find((h) => h.address?.house_number)
    if (exact) return toLatLng(exact)
  }
  return toLatLng(hits[0])
}

/**
 * Reverse-geocodes a point into the display strings used by the gym cards
 * ("Rua, 123 — Bairro" / "Cidade · UF") via Nominatim. Null on failure.
 */
export async function reverseGeocode(
  point: LatLng,
): Promise<{ address?: string; city?: string } | null> {
  const qs = new URLSearchParams({
    format: 'json',
    lat: String(point.lat),
    lon: String(point.lng),
  })
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?${qs.toString()}`,
      { headers: { Accept: 'application/json' } },
    )
    if (!res.ok) return null
    const d = await res.json()
    const a = (d?.address ?? {}) as Record<string, string>
    const street = [a.road, a.house_number].filter(Boolean).join(', ')
    const district = a.suburb ?? a.neighbourhood ?? a.quarter
    const cityName = a.city ?? a.town ?? a.village ?? a.municipality
    const uf = (a['ISO3166-2-lvl4'] ?? '').split('-')[1]
    const address =
      [street, district].filter(Boolean).join(' — ') || undefined
    const city = [cityName, uf].filter(Boolean).join(' · ') || undefined
    return address || city ? { address, city } : null
  } catch {
    return null
  }
}

/** Structured address parts for geocoding (more reliable than free-form). */
export interface AddressParts {
  street?: string
  number?: string
  district?: string
  city?: string
  uf?: string
  cep?: string
}

/**
 * Geocodes an address to coordinates via OpenStreetMap Nominatim. Tries a
 * structured query first (street/city/postcode), then falls back to free-form.
 * Returns null when nothing matches or the request fails.
 */
export async function geocodeAddress(
  query: string | AddressParts,
): Promise<LatLng | null> {
  if (typeof query === 'string') {
    const q = query.trim()
    if (!q) return null
    return pickPrecise(await queryNominatim({ q }), /\d/.test(q))
  }

  const { street, number, district, city, uf, cep } = query
  const hasHouse = Boolean(street && number)
  // Brazilian order ("Rua Tal, 123") parses more reliably than "123 Rua Tal".
  const streetLine = [street, number].filter(Boolean).join(', ')

  // Tier 1 — free-form WITH the house number. This is what lets the pin land
  // on the exact address; we only accept it when a rooftop match comes back.
  if (streetLine) {
    const free = [streetLine, district, city, uf, 'Brasil'].filter(Boolean).join(', ')
    const hits = await queryNominatim({ q: free })
    if (hasHouse) {
      const exact = hits.find((h) => h.address?.house_number)
      if (exact) return toLatLng(exact)
    } else {
      const precise = pickPrecise(hits, false)
      if (precise) return precise
    }
  }

  // Tier 2 — structured query (street/city/state) for a street-level match.
  if (street || city) {
    const structured = await queryNominatim({
      ...(streetLine ? { street: streetLine } : {}),
      ...(city ? { city } : {}),
      ...(uf ? { state: uf } : {}),
      country: 'Brazil',
    })
    const precise = pickPrecise(structured, hasHouse)
    if (precise) return precise
  }

  // Tier 3 — CEP centroid as a last resort.
  const cepDigits = (cep ?? '').replace(/\D/g, '')
  if (cepDigits.length === 8) {
    return pickPrecise(
      await queryNominatim({ postalcode: cepDigits, country: 'Brazil' }),
      false,
    )
  }

  return null
}

/**
 * The gym's registered location (set by the teacher via PUT /Gyms/Location).
 * Fetches GET /Gyms/Geolocation once and returns the point, or null while
 * loading / when the gym has no location yet (the backend answers 400).
 */
export function useGymLocation(enabled = true): LatLng | null {
  const [point, setPoint] = useState<LatLng | null>(null)

  useEffect(() => {
    if (!enabled) return
    let active = true
    api
      .get('/Gyms/Geolocation')
      .then(({ data }) => {
        const lat = (data as { latitude?: number })?.latitude
        const lng = (data as { longitude?: number })?.longitude
        if (active && typeof lat === 'number' && typeof lng === 'number') {
          setPoint({ lat, lng })
        }
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [enabled])

  return point
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
