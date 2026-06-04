import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link2, Plus, Check } from 'lucide-react'
import { api, asList, getErrorMessage } from '@/lib/api'
import { useGymStore } from '@/store/gymStore'
import { useInviteStore } from '@/store/inviteStore'
import { useNotificationStore } from '@/store/notificationStore'
import { Brand } from '@/components/ui/Brand'
import { Hero } from '@/components/ui/Hero'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { NotificationsMenu } from '@/components/ui/NotificationsMenu'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Skeleton, SkeletonList } from '@/components/ui/Skeleton'
import { maskCnpj, maskCpf } from '@/lib/format'
import type { InviteRequest, Student } from '@/types'

function Stat({
  label,
  value,
  badge,
}: {
  label: string
  value: number | string
  badge?: string
}) {
  return (
    <Card>
      <p className="text-[11px] font-semibold uppercase leading-tight tracking-wide text-muted">
        {label}
      </p>
      <div className="mt-1.5 flex items-end justify-between">
        <p className="font-display text-3xl font-extrabold text-content">{value}</p>
        {badge && <Badge tone="soft">{badge}</Badge>}
      </div>
    </Card>
  )
}

function StatSkeleton() {
  return (
    <Card>
      <Skeleton className="h-3 w-2/3" />
      <Skeleton className="mt-3 h-8 w-10" />
    </Card>
  )
}

export function TeacherHome() {
  const navigate = useNavigate()
  const gym = useGymStore((s) => s.gym)
  const invites = useInviteStore((s) => s.invites)
  const setItems = useNotificationStore((s) => s.setItems)

  const [requests, setRequests] = useState<InviteRequest[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const [reqRes, stuRes] = await Promise.allSettled([
          api.get('/Gym/Invite/Requests'),
          api.get('/Gym/Students/Select'),
        ])
        if (!active) return
        if (reqRes.status === 'fulfilled')
          setRequests(asList<InviteRequest>(reqRes.value.data))
        if (stuRes.status === 'fulfilled')
          setStudents(asList<Student>(stuRes.value.data))
        if (reqRes.status === 'rejected' && stuRes.status === 'rejected')
          setError(getErrorMessage(reqRes.reason, 'Não foi possível carregar os dados.'))
      } catch (err) {
        if (active) setError(getErrorMessage(err))
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  const pending = requests.filter((r) => (r.status ?? 'pending') === 'pending')
  const activeInvites = invites.filter((i) => i.status !== 'used')

  // Publish pending join requests to the notification feed (bell).
  useEffect(() => {
    setItems(
      pending.map((r) => ({
        id: `req-${r.id_aluno}`,
        title: 'Nova solicitação',
        description: `${r.name ?? 'Aluno'} quer entrar na academia.`,
        to: '/requests',
      })),
    )
  }, [requests, setItems]) // eslint-disable-line react-hooks/exhaustive-deps

  async function approve(id: string | number) {
    try {
      await api.post('/Gym/Invite/Approvation', { id_aluno: id })
      setRequests((rs) =>
        rs.map((r) => (r.id_aluno === id ? { ...r, status: 'approved' } : r)),
      )
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível aprovar a solicitação.'))
    }
  }

  return (
    <div className="flex flex-col">
      <Hero
        topBar={
          <>
            <span className="flex items-center gap-2">
              <Brand size={32} wordmarkClassName="text-lg text-white" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                Professor
              </span>
            </span>
            <div className="flex items-center gap-1">
              <ThemeToggle className="hover:bg-white/10" />
              <NotificationsMenu className="hover:bg-white/10" />
            </div>
          </>
        }
      >
        <Badge tone="primary" className="mt-3">
          Academia
        </Badge>
        <h1 className="mt-3 font-display text-2xl font-extrabold uppercase leading-tight tracking-tight">
          {gym?.name ?? 'Sua academia'}
        </h1>
        {gym?.cnpj && (
          <p className="mt-1 text-sm text-white/60">CNPJ {maskCnpj(gym.cnpj)}</p>
        )}
      </Hero>

      <div className="-mt-4 flex flex-col gap-5 rounded-t-3xl bg-canvas px-6 pb-6 pt-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {loading ? (
            <>
              <StatSkeleton />
              <StatSkeleton />
              <StatSkeleton />
            </>
          ) : (
            <>
              <Stat label="Convites ativos" value={activeInvites.length} />
              <Stat
                label="Solicitações pendentes"
                value={pending.length}
                badge={pending.length > 0 ? 'Novo' : undefined}
              />
              <Stat
                label="Alunos cadastrados"
                value={students.length}
                badge={undefined}
              />
            </>
          )}
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {/* Recent invites */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-sm font-bold uppercase tracking-tight text-content">
                Convites recentes
              </h2>
              <button
                onClick={() => navigate('/invites')}
                className="flex items-center gap-1 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-white shadow-primary transition-all hover:bg-primary-dark active:scale-95"
              >
                <Plus size={14} /> Gerar
              </button>
            </div>
            {activeInvites.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-line bg-surface px-4 py-6 text-center text-sm text-muted">
                Nenhum convite ativo. Gere um para compartilhar.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {activeInvites.slice(0, 2).map((inv) => (
                  <Card key={inv.id} className="flex items-center gap-3 py-3">
                    <Link2 size={20} className="shrink-0 text-content" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-xs text-content">
                        {inv.url ?? inv.token}
                      </p>
                      <Badge tone="primary" className="mt-1">
                        Ativo
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Pending requests preview */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-sm font-bold uppercase tracking-tight text-content">
                Solicitações pendentes
              </h2>
              <button
                onClick={() => navigate('/requests')}
                className="text-xs font-semibold uppercase tracking-wide text-primary transition-colors hover:text-primary-dark"
              >
                Ver todas
              </button>
            </div>
            {loading ? (
              <SkeletonList rows={2} />
            ) : pending.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-line bg-surface px-4 py-6 text-center text-sm text-muted">
                Nenhuma solicitação pendente.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {pending.slice(0, 3).map((r) => (
                  <Card key={r.id_aluno} className="flex items-center gap-3 py-3">
                    <Avatar name={r.name} size="h-10 w-10 text-base" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-content">
                        {r.name ?? 'Aluno'}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {maskCpf(r.cpf ?? '') || '—'}
                      </p>
                    </div>
                    <button
                      onClick={() => approve(r.id_aluno)}
                      aria-label="Aceitar"
                      className="flex h-9 items-center gap-1 rounded-full bg-primary px-3.5 text-xs font-semibold uppercase tracking-wide text-white shadow-primary transition-all hover:bg-primary-dark active:scale-95"
                    >
                      <Check size={16} /> Aceitar
                    </button>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>

        {error && <p className="text-center text-xs text-muted">{error}</p>}
      </div>
    </div>
  )
}
