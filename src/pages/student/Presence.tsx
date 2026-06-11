import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle2,
  Clock,
  GraduationCap,
  Navigation,
  LocateFixed,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react'
import { api, asList, getErrorMessage } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { enrolledGym } from '@/lib/auth'
import { Header } from '@/components/layout/Header'
import { FormLayout } from '@/components/layout/FormLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { InfoNote } from '@/components/ui/InfoNote'
import { FormError } from '@/components/ui/FormError'
import { SectionTitle } from '@/components/ui/SectionTitle'
import { MapView } from '@/components/ui/MapView'
import { EmptyState } from '@/components/ui/EmptyState'
import { DEMO_GYM } from '@/lib/demo'
import { formatTime } from '@/lib/format'
import {
  openDirections,
  getCurrentPosition,
  haversineMeters,
  formatDistance,
  CHECKIN_RADIUS_M,
  type LatLng,
} from '@/lib/geo'

const today = new Date().toLocaleDateString('pt-BR', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
})

/** A class returned by GET /Gyms/Classes/Day. */
interface Aula {
  id_aula: string
  conteudo?: string
  data_aula?: string
  faixa?: string
  id_instrutor?: string
}

/** Geofence verification states for the GPS check-in. */
type GeoState =
  | { status: 'checking' }
  | { status: 'inside'; distanceM: number }
  | { status: 'outside'; distanceM: number }
  | { status: 'denied' }
  | { status: 'error' }
  | { status: 'unsupported' }

/**
 * Confirm attendance for a class of the day. The check-in is geofenced: the
 * athlete's GPS position must be within {@link CHECKIN_RADIUS_M} of the gym
 * (GET /Gyms/Geolocation) before POST /Student/Presence is allowed. The backend
 * additionally enforces that the class belongs to the athlete's belt.
 */
export function Presence() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const userFaixa = user?.faixa
  const gymName = enrolledGym(user)?.nome ?? DEMO_GYM.name

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [geo, setGeo] = useState<GeoState>({ status: 'checking' })

  const [gymPoint, setGymPoint] = useState<LatLng | null>(null)
  const [aulas, setAulas] = useState<Aula[]>([])
  const [selectedAula, setSelectedAula] = useState<string>('')
  const [coords, setCoords] = useState<LatLng | null>(null)

  // Load gym location (geofence anchor) + today's classes.
  useEffect(() => {
    api
      .get('/Gyms/Geolocation')
      .then(({ data }) => {
        const lat = (data as { latitude?: number })?.latitude
        const lng = (data as { longitude?: number })?.longitude
        if (typeof lat === 'number' && typeof lng === 'number') {
          setGymPoint({ lat, lng })
        }
      })
      .catch(() => {})

    api
      .get('/Gyms/Classes/Day')
      .then(({ data }) => {
        const list = asList<Aula>(data)
        setAulas(list)
        const mine =
          list.find((a) => !userFaixa || a.faixa === userFaixa) ?? list[0]
        if (mine) setSelectedAula(mine.id_aula)
      })
      .catch(() => {})
  }, [userFaixa])

  const verifyLocation = useCallback(async () => {
    setGeo({ status: 'checking' })
    try {
      const pos = await getCurrentPosition()
      setCoords(pos)
      if (!gymPoint) {
        setGeo({ status: 'error' })
        return
      }
      const distanceM = haversineMeters(pos, gymPoint)
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
  }, [gymPoint])

  // Verify location once the gym anchor is known.
  useEffect(() => {
    if (gymPoint) verifyLocation()
  }, [gymPoint, verifyLocation])

  async function handleConfirm() {
    if (geo.status !== 'inside' || !coords) return
    if (!selectedAula) {
      setError('Nenhuma aula disponível hoje para a sua graduação.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      await api.post('/Student/Presence', {
        id_aula: selectedAula,
        latitude: coords.lat,
        longitude: coords.lng,
      })
      setDone(true)
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          'Não foi possível confirmar a presença. Verifique se há uma aula ativa para a sua graduação.',
        ),
      )
    } finally {
      setLoading(false)
    }
  }

  const point = gymPoint ?? { lat: DEMO_GYM.lat, lng: DEMO_GYM.lng }
  const selected = aulas.find((a) => a.id_aula === selectedAula)

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
            Sua presença em {selected?.conteudo ?? 'aula'} foi registrada na
            academia.
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
                    Aulas de hoje
                  </p>
                  <p className="mt-1 font-display text-lg font-bold capitalize text-content">
                    {today}
                  </p>
                </div>
                <Badge tone="primary">{aulas.length}</Badge>
              </div>

              {aulas.length === 0 ? (
                <EmptyState
                  icon={GraduationCap}
                  message="Nenhuma aula cadastrada para hoje."
                />
              ) : (
                <div className="flex flex-col gap-2 border-t border-line pt-4">
                  {aulas.map((a) => {
                    const active = a.id_aula === selectedAula
                    return (
                      <button
                        key={a.id_aula}
                        onClick={() => setSelectedAula(a.id_aula)}
                        className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                          active
                            ? 'border-primary bg-primary-soft'
                            : 'border-line bg-surface hover:border-primary/40'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-content">
                            {a.conteudo ?? 'Aula'}
                          </p>
                          <p className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                            <Clock size={13} className="text-primary" />
                            {formatTime(a.data_aula) || '—'}
                            {a.faixa && <span>· {a.faixa}</span>}
                          </p>
                        </div>
                        {active && (
                          <ShieldCheck size={16} className="shrink-0 text-primary" />
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </Card>

            <div className="flex flex-col gap-3">
              <MapView
                point={point}
                label={gymName}
                distance={
                  geo.status === 'inside' || geo.status === 'outside'
                    ? formatDistance(geo.distanceM)
                    : undefined
                }
                height={150}
                onOpen={() => openDirections(point)}
              />
              <Button variant="secondary" onClick={() => openDirections(point)}>
                <Navigation size={17} /> Como chegar
              </Button>
            </div>
          </div>
        }
      >
        <SectionTitle underline>Confirmar presença</SectionTitle>

        <InfoNote>
          A presença só é registrada quando você está na academia (até{' '}
          {CHECKIN_RADIUS_M} m), há uma aula ativa e ela é da sua graduação.
        </InfoNote>

        <GeofencePanel geo={geo} onRetry={verifyLocation} point={point} />

        {error && <FormError>{error}</FormError>}

        <Button
          loading={loading}
          disabled={geo.status !== 'inside' || !selectedAula}
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
  point,
}: {
  geo: GeoState
  onRetry: () => void
  point: LatLng
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
          : 'Não foi possível obter sua localização (ou a academia ainda não cadastrou a dela). Tente novamente.'

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
            onClick={() => openDirections(point)}
            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-line bg-surface text-sm font-semibold text-content transition-colors hover:border-content/30"
          >
            <Navigation size={16} /> Como chegar
          </button>
        )}
      </div>
    </div>
  )
}
