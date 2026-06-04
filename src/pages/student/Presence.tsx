import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Clock, User, MapPin, Navigation } from 'lucide-react'
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
import { DEMO_CLASS, DEMO_GYM } from '@/lib/demo'
import { openDirections } from '@/lib/geo'

const GYM_POINT = { lat: DEMO_GYM.lat, lng: DEMO_GYM.lng }

const today = new Date().toLocaleDateString('pt-BR', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
})

/**
 * Confirm attendance for the current class. The class must already exist on the
 * backend; presence is registered via POST /Student/Presence.
 */
export function Presence() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function handleConfirm() {
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
            Sua presença em {DEMO_CLASS.modality} foi registrada.
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
          A confirmação só é registrada se houver uma aula ativa na sua academia.
        </InfoNote>

        {error && <FormError>{error}</FormError>}

        <Button loading={loading} onClick={handleConfirm}>
          Confirmar presença
        </Button>
        <Button variant="secondary" onClick={() => navigate('/gyms')}>
          Cancelar
        </Button>
      </FormLayout>
    </div>
  )
}
