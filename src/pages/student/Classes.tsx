import { useEffect, useState } from 'react'
import { GraduationCap, Clock, CalendarDays } from 'lucide-react'
import { api, asList, getErrorMessage } from '@/lib/api'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { FormError } from '@/components/ui/FormError'
import { SkeletonList } from '@/components/ui/Skeleton'
import { formatWallDate, formatWallTime } from '@/lib/format'

interface Aula {
  id_aula: string
  conteudo?: string
  data_aula?: string
  faixa?: string
}

/**
 * Student view of today's classes (GET /Gyms/Classes/Day). Read-only — shows
 * each class's content, time and target belt. The check-in happens on the
 * Presence screen.
 */
export function StudentClasses() {
  const [aulas, setAulas] = useState<Aula[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .get('/Gyms/Classes/Day')
      .then(({ data }) => setAulas(asList<Aula>(data)))
      .catch((err) =>
        setError(getErrorMessage(err, 'Não foi possível carregar as aulas.')),
      )
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex flex-col">
      <Header
        title="Aulas"
        subtitle="Aulas de hoje na sua academia."
        backTo="/gyms"
      />

      <div className="flex flex-col gap-4 px-6 py-6">
        {error && <FormError>{error}</FormError>}

        {loading ? (
          <SkeletonList rows={3} />
        ) : aulas.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            message="Nenhuma aula para hoje. Seu professor publicará as aulas aqui."
          />
        ) : (
          aulas.map((a) => (
            <Card key={a.id_aula} className="flex items-center gap-3 p-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                <GraduationCap size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-display text-[15px] font-bold uppercase tracking-tight text-content">
                  {a.conteudo ?? 'Aula'}
                </h3>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                  <span className="flex items-center gap-1">
                    <CalendarDays size={13} className="text-primary" />
                    {formatWallDate(a.data_aula) || '—'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={13} className="text-primary" />
                    {formatWallTime(a.data_aula) || '—'}
                  </span>
                  {a.faixa && <Badge tone="neutral">{a.faixa}</Badge>}
                </p>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
