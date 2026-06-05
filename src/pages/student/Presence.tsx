import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle2,
  Clock,
  User,
  MapPin,
  Navigation,
  LocateFixed,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react'
import { api, getErrorMessage } from '@/lib/api'
import { Header } from '@/components/layout/Header'
import { FormLayout } from '@/components/layout/FormLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { InfoNote } from '@/components/ui/InfoNote'
import { FormError } from '@/components/ui/FormError'
import { SectionTitle } from '@/components/ui/SectionTitle'
import { MapView } from '@/components/ui/MapView'
import { PREVIEW_MODE } from '@/lib/preview'
import { DEMO_CLASS, DEMO_GYM } from '@/lib/demo'
import {
  openDirections,
  getCurrentPosition,
  haversineMeters,
  formatDistance,
  CHECKIN_RADIUS_M,
  type LatLng,
} from '@/lib/geo'

const GYM_POINT = { lat: DEMO_GYM.lat, lng: DEMO_GYM.lng }

const today = new Date().toLocaleDateString('pt-BR', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
})

/** Geofence verification states for the GPS check-in. */
type GeoState =
  | { status: 'checking' }
  | { status: 'inside'; distanceM: number }
  | { status: 'outside'; distanceM: number }
  | { status: 'denied' }
  | { status: 'error' }
  | { status: 'unsupported' }

/**
 * Confirm attendance for the current class. The check-in is geofenced: the
 * athlete's GPS position must be within {@link CHECKIN_RADIUS_M} of the gym
 * before POST /Student/Presence is allowed — this prevents remote check-ins.
 */
export function Presence() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [geo, setGeo] = useState<GeoState>({ status: 'checking' })

  const verifyLocation = useCallback(async () => {
    setGeo({ status: 'checking' })
    try {
      let coords: LatLng
      if (PREVIEW_MODE) {
        // Demo has no real backend and the device isn't in Santos — simulate the
        // athlete standing at the gym (~40 m away) so the happy path is visible.
        coords = { lat: DEMO_GYM.lat + 0.0003, lng: DEMO_GYM.lng + 0.0002 }
      } else {
        coords = await getCurrentPosition()
      }
      const distanceM = haversineMeters(coords, GYM_POINT)
      setGeo({
        status: distanceM <= CHECKIN_RADIUS_M ? 'inside' : 'outside',
        distanceM,
      })
    } catch (err) {
      if (err instanceof Error && err.message === 'unsupported') {
        setGeo({ status: 'unsupported' })
      } else if ((err as GeolocationPositionError)?.code === 1) {
        setGeo({ status: 'denied' })
      } else {
        setGeo({ status: 'error' })
      }
    }
  }, [])

  // Verify location as soon as the screen opens.
  useEffect(() => {
    verifyLocation()
  }, [verifyLocation])

  async function handleConfirm() {
    if (geo.status !== 'inside') return
    setError(null)
    setLoading(true)
    try {
      await api.post('/Student/Presence')
      setDone(true)
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          'Não foi possível confirmar a presença. Verifique se há uma aula ativa.',
        ),
      )
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="flex flex-col">
        <Header title="Presença" />
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center px-6 py-12 text-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={38} />
          </span>
          <h1 className="mt-5 font-display text-2xl font-extrabold uppercase tracking-tight text-content">
            Presença confirmada!
          </h1>
          <p className="mt-2 text-sm text-muted">
            Sua presença em {DEMO_CLASS.modality} foi registrada na academia.
          </p>
          <div className="mt-8 w-full">
            <Button onClick={() => navigate('/gyms')}>Concluir</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <Header title="Presença" />

      <FormLayout
        aside={
          <div className="flex flex-col gap-4">
            <Card className="flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-muted">
                    Aula de hoje
                  </p>
                  <p className="mt-1 font-display text-lg font-bold capitalize text-content">
                    {today}
                  </p>
                </div>
                <Badge tone="primary">Ativa</Badge>
              </div>

              <p className="font-display text-base font-bold uppercase tracking-tight text-content">
                {DEMO_CLASS.modality}
              </p>

              <div className="space-y-2.5 border-t border-line pt-4 text-sm">
                <p className="flex items-center gap-2.5 text-content">
                  <Clock size={16} className="text-primary" /> {DEMO_CLASS.time}
                </p>
                <p className="flex items-center gap-2.5 text-content">
                  <User size={16} className="text-primary" /> {DEMO_CLASS.instructor}
                </p>
                <p className="flex items-center gap-2.5 text-content">
                  <MapPin size={16} className="text-primary" /> {DEMO_CLASS.location}
                </p>
              </div>
            </Card>

            <div className="flex flex-col gap-3">
              <MapView
                point={GYM_POINT}
                label={DEMO_GYM.name}
                distance={
                  geo.status === 'inside' || geo.status === 'outside'
                    ? formatDistance(geo.distanceM)
                    : undefined
                }
                height={150}
                onOpen={() => openDirections(GYM_POINT)}
              />
              <Button variant="secondary" onClick={() => openDirections(GYM_POINT)}>
                <Navigation size={17} /> Como chegar
              </Button>
            </div>
          </div>
        }
      >
        <SectionTitle underline>Confirmar presença</SectionTitle>

        <InfoNote>
          A presença só é registrada quando você está na academia (até{' '}
          {CHECKIN_RADIUS_M} m) e há uma aula ativa.
        </InfoNote>

        <GeofencePanel geo={geo} onRetry={verifyLocation} />

        {error && <FormError>{error}</FormError>}

        <Button
          loading={loading}
          disabled={geo.status !== 'inside'}
          onClick={handleConfirm}
        >
          {geo.status === 'inside' ? (
            <>
              <ShieldCheck size={18} /> Confirmar presença
            </>
          ) : (
            'Confirmar presença'
          )}
        </Button>
        <Button variant="secondary" onClick={() => navigate('/gyms')}>
          Cancelar
        </Button>
      </FormLayout>
    </div>
  )
}

/** Live geofence status box driving whether check-in is allowed. */
function GeofencePanel({
  geo,
  onRetry,
}: {
  geo: GeoState
  onRetry: () => void
}) {
  if (geo.status === 'checking') {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3.5">
        <span className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted">Verificando sua localização…</p>
      </div>
    )
  }

  if (geo.status === 'inside') {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-400">
        <LocateFixed size={20} className="shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-bold">Você está na academia</p>
          <p className="text-xs opacity-80">
            A {formatDistance(geo.distanceM)} do tatame · pronto para o check-in.
          </p>
        </div>
      </div>
    )
  }

  const isOutside = geo.status === 'outside'
  const message =
    geo.status === 'outside'
      ? `Você está a ${formatDistance(geo.distanceM)} da academia. Aproxime-se até ${CHECKIN_RADIUS_M} m para confirmar.`
      : geo.status === 'denied'
        ? 'Permita o acesso à localização para confirmar sua presença.'
        : geo.status === 'unsupported'
          ? 'Seu dispositivo não suporta geolocalização.'
          : 'Não foi possível obter sua localização. Tente novamente.'

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-primary/30 bg-primary-soft px-4 py-3.5">
      <div className="flex items-start gap-3 text-primary">
        <AlertTriangle size={20} className="mt-0.5 shrink-0" />
        <p className="text-sm font-medium">{message}</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onRetry}
          className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-white shadow-primary transition-all hover:bg-primary-dark active:scale-[0.98]"
        >
          <LocateFixed size={16} /> Verificar novamente
        </button>
        {isOutside && (
          <button
            onClick={() => openDirections(GYM_POINT)}
            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-line bg-surface text-sm font-semibold text-content transition-colors hover:border-content/30"
          >
            <Navigation size={16} /> Como chegar
          </button>
        )}
      </div>
    </div>
  )
}
