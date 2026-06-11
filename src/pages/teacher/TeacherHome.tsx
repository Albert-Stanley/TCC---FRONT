import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Link2,
  Plus,
  Check,
  Users,
  Navigation,
  MapPin,
  ChevronRight,
  GraduationCap,
} from 'lucide-react'
import { getErrorMessage } from '@/lib/api'
import { loadRoster, approveRequest } from '@/lib/roster'
import { useAuthStore } from '@/store/authStore'
import { useGymStore } from '@/store/gymStore'
import { useInviteStore } from '@/store/inviteStore'
import { useRequestsStore } from '@/store/requestsStore'
import { useStudentsStore } from '@/store/studentsStore'
import { useNotificationStore } from '@/store/notificationStore'
import { DEMO_GYM } from '@/lib/demo'
import { openDirections, useGymLocation } from '@/lib/geo'
import { Brand } from '@/components/ui/Brand'
import { Logo } from '@/components/ui/Logo'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { NotificationsMenu } from '@/components/ui/NotificationsMenu'
import { MapView } from '@/components/ui/MapView'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { SectionTitle } from '@/components/ui/SectionTitle'
import { Skeleton, SkeletonList } from '@/components/ui/Skeleton'
import { maskCnpj, maskCpf } from '@/lib/format'

const todayLine = new Date().toLocaleDateString('pt-BR', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
})

function titleCase(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : s
}

export function TeacherHome() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const gym = useGymStore((s) => s.gym)
  const invites = useInviteStore((s) => s.invites)
  const setItems = useNotificationStore((s) => s.setItems)

  const requests = useRequestsStore((s) => s.requests)
  const students = useStudentsStore((s) => s.students)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    loadRoster()
      .catch((err) => {
        if (active)
          setError(getErrorMessage(err, 'Não foi possível carregar os dados.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
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
    setError(null)
    try {
      await approveRequest(id)
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível aprovar a solicitação.'))
    }
  }

  const firstName = titleCase((user?.name ?? 'Professor').split(' ')[0])
  const gymName = gym?.name ?? DEMO_GYM.name
  // Authoritative location from GET /Gyms/Geolocation (registered via
  // PUT /Gyms/Location); falls back to the locally cached gym, then demo.
  const registeredPoint = useGymLocation()
  const gymPoint =
    registeredPoint ??
    (gym?.lat != null && gym?.lng != null
      ? { lat: gym.lat, lng: gym.lng }
      : { lat: DEMO_GYM.lat, lng: DEMO_GYM.lng })
  const gymAddress = gym?.address ?? DEMO_GYM.address
  const gymCity = gym?.city ?? DEMO_GYM.city

  return (
    <div className="flex flex-col">
      {/* Mobile top bar (brand + actions); hidden on desktop sidebar. */}
      <div className="flex h-14 items-center justify-between px-5 pt-safe lg:hidden">
        <span className="flex items-center gap-2">
          <Brand size={30} wordmarkClassName="text-base text-content" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
            Professor
          </span>
        </span>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <NotificationsMenu />
        </div>
      </div>

      <div className="flex flex-col gap-5 px-5 pb-8 pt-2">
        {/* Greeting */}
        <div>
          <p className="text-sm font-medium capitalize text-muted">{todayLine}</p>
          <h1 className="mt-1 font-display text-[26px] font-extrabold leading-tight tracking-tight text-content">
            Bem-vindo, {firstName}! 💪
          </h1>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {/* Featured gym card */}
          <Card className="relative flex flex-col gap-4 overflow-hidden">
            <span className="absolute right-0 top-0 rounded-bl-2xl bg-emerald-500 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white">
              Ativa
            </span>

            <div className="flex items-center gap-3.5 pr-16">
              <Logo size={56} rounded="rounded-2xl" />
              <div className="min-w-0">
                <h2 className="truncate font-display text-lg font-extrabold uppercase tracking-tight text-content">
                  {gymName}
                </h2>
                <p className="truncate text-sm text-muted">
                  {gym?.cnpj ? `CNPJ ${maskCnpj(gym.cnpj)}` : 'Sua academia'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <MiniStat label="Alunos" value={students.length} loading={loading} />
              <MiniStat label="Convites" value={activeInvites.length} loading={loading} />
              <MiniStat
                label="Pendentes"
                value={pending.length}
                loading={loading}
                highlight={pending.length > 0}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button onClick={() => navigate('/students')}>
                <Users size={17} /> Alunos
              </Button>
              <Button variant="secondary" onClick={() => navigate('/invites')}>
                <Plus size={17} /> Convite
              </Button>
            </div>
          </Card>

          {/* Location map */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <SectionTitle underline>Onde fica</SectionTitle>
            </div>
            <MapView
              point={gymPoint}
              label={gymName}
              height={150}
              onOpen={() => openDirections(gymPoint)}
            />
            <div className="flex items-start gap-2.5 px-1 text-sm">
              <MapPin size={16} className="mt-0.5 shrink-0 text-primary" />
              <p className="text-muted">
                <span className="font-semibold text-content">{gymAddress}</span>
                <br />
                {gymCity}
              </p>
            </div>
            <Button variant="secondary" onClick={() => openDirections(gymPoint)}>
              <Navigation size={17} /> Como chegar
            </Button>
          </section>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {/* Pending requests */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <SectionTitle>Solicitações pendentes</SectionTitle>
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
              <EmptyHint>Nenhuma solicitação pendente.</EmptyHint>
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

          {/* Recent invites */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <SectionTitle>Convites recentes</SectionTitle>
              <button
                onClick={() => navigate('/invites')}
                className="flex items-center gap-1 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-white shadow-primary transition-all hover:bg-primary-dark active:scale-95"
              >
                <Plus size={14} /> Gerar
              </button>
            </div>
            {activeInvites.length === 0 ? (
              <EmptyHint>Nenhum convite ativo. Gere um para compartilhar.</EmptyHint>
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
        </div>

        {/* Manage classes shortcut */}
        <button onClick={() => navigate('/classes')} className="w-full text-left">
          <Card interactive className="flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-ink text-white dark:bg-white/10">
              <GraduationCap size={22} />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-[15px] font-bold uppercase tracking-tight text-content">
                Gerenciar aulas
              </h3>
              <p className="text-sm text-muted">Crie aulas, conteúdos e vídeos.</p>
            </div>
            <ChevronRight size={20} className="shrink-0 text-neutral-300" />
          </Card>
        </button>

        {error && <p className="text-center text-xs text-muted">{error}</p>}
      </div>
    </div>
  )
}

function MiniStat({
  label,
  value,
  loading,
  highlight,
}: {
  label: string
  value: number
  loading: boolean
  highlight?: boolean
}) {
  return (
    <div className="rounded-2xl bg-canvas px-3 py-2.5 text-center">
      {loading ? (
        <Skeleton className="mx-auto h-7 w-8" />
      ) : (
        <p
          className={`font-display text-2xl font-extrabold ${
            highlight ? 'text-primary' : 'text-content'
          }`}
        >
          {value}
        </p>
      )}
      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
    </div>
  )
}

function EmptyHint({ children }: { children: string }) {
  return (
    <p className="rounded-2xl border border-dashed border-line bg-surface px-4 py-6 text-center text-sm text-muted">
      {children}
    </p>
  )
}
