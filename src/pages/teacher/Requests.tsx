import { useEffect, useMemo, useState } from 'react'
import { Check, X, FileText, MapPin, Inbox } from 'lucide-react'
import { api, asList, getErrorMessage } from '@/lib/api'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { SkeletonList } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { FormError } from '@/components/ui/FormError'
import { maskCpf, maskCep, formatDate } from '@/lib/format'
import type { InviteRequest } from '@/types'

type Status = 'pending' | 'approved' | 'refused'
type Filter = 'all' | Status

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'pending', label: 'Pendentes' },
  { key: 'approved', label: 'Aprovadas' },
  { key: 'refused', label: 'Recusadas' },
]

export function Requests() {
  const [requests, setRequests] = useState<InviteRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [busyId, setBusyId] = useState<string | number | null>(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const { data } = await api.get('/Gym/Invite/Requests')
        const list = asList<InviteRequest>(data).map((r) => ({
          ...r,
          status: r.status ?? 'pending',
        }))
        if (active) setRequests(list)
      } catch (err) {
        if (active) setError(getErrorMessage(err, 'Não foi possível carregar as solicitações.'))
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  const counts = useMemo(() => {
    const c = { all: requests.length, pending: 0, approved: 0, refused: 0 }
    for (const r of requests) c[(r.status ?? 'pending') as Status]++
    return c
  }, [requests])

  const visible = requests.filter(
    (r) => filter === 'all' || (r.status ?? 'pending') === filter,
  )

  async function approve(id: string | number) {
    setBusyId(id)
    setError(null)
    try {
      await api.post('/Gym/Invite/Approvation', { id_aluno: id })
      setRequests((rs) =>
        rs.map((r) => (r.id_aluno === id ? { ...r, status: 'approved' } : r)),
      )
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível aprovar a solicitação.'))
    } finally {
      setBusyId(null)
    }
  }

  // No reject endpoint in the authoritative map — refusal is tracked locally.
  function refuse(id: string | number) {
    setRequests((rs) =>
      rs.map((r) => (r.id_aluno === id ? { ...r, status: 'refused' } : r)),
    )
  }

  return (
    <div className="flex flex-col">
      <Header
        title="Solicitações"
        subtitle="Aprove ou recuse pedidos de entrada na academia."
        back={false}
        badge={counts.pending || undefined}
      />

      <div className="flex flex-col gap-4 px-6 py-6">
        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold uppercase tracking-wide transition-all ${
                filter === key
                  ? 'bg-primary text-white shadow-primary'
                  : 'border border-line bg-surface text-muted hover:text-content'
              }`}
            >
              {label} ({counts[key]})
            </button>
          ))}
        </div>

        {error && <FormError>{error}</FormError>}

        {loading ? (
          <SkeletonList rows={4} />
        ) : visible.length === 0 ? (
          <EmptyState icon={Inbox} message="Nenhuma solicitação nesta categoria." />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {visible.map((r) => {
            const status = r.status ?? 'pending'
            return (
              <Card key={r.id_aluno} className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <Avatar name={r.name} />
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-bold text-content">
                      {r.name ?? 'Aluno'}
                    </h3>
                    <p className="text-xs text-muted">
                      Solicitado {formatDate(r.requestedAt) || '—'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex items-start gap-2">
                    <FileText size={16} className="mt-0.5 text-muted" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
                        CPF
                      </p>
                      <p className="text-sm text-content">{maskCpf(r.cpf ?? '') || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin size={16} className="mt-0.5 text-muted" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
                        CEP
                      </p>
                      <p className="text-sm text-content">{maskCep(r.cep ?? '') || '—'}</p>
                    </div>
                  </div>
                </div>

                {status === 'pending' ? (
                  <div className="flex gap-3">
                    <button
                      disabled={busyId === r.id_aluno}
                      onClick={() => approve(r.id_aluno)}
                      className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold uppercase tracking-wide text-white shadow-primary transition-all hover:bg-primary-dark active:scale-[0.98] disabled:opacity-50"
                    >
                      <Check size={18} /> Aceitar
                    </button>
                    <button
                      disabled={busyId === r.id_aluno}
                      onClick={() => refuse(r.id_aluno)}
                      className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-line bg-surface text-sm font-semibold uppercase tracking-wide text-muted transition-all hover:border-content/30 hover:text-content active:scale-[0.98] disabled:opacity-50"
                    >
                      <X size={18} /> Recusar
                    </button>
                  </div>
                ) : (
                  <Badge tone={status === 'approved' ? 'success' : 'neutral'}>
                    {status === 'approved' ? 'Aprovada' : 'Recusada'}
                  </Badge>
                )}
              </Card>
            )
          })}
          </div>
        )}
      </div>
    </div>
  )
}
