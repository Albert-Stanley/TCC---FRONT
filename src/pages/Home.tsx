import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarCheck,
  CreditCard,
  Navigation,
  MapPin,
  Clock,
  Flame,
  ChevronRight,
  LocateFixed,
  Building2,
  GraduationCap,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useNotificationStore } from '@/store/notificationStore'
import { PREVIEW_MODE } from '@/lib/preview'
import { DEMO_GYM } from '@/lib/demo'
import { openDirections, haversineMeters, formatDistance, useUserLocation } from '@/lib/geo'
import { Brand } from '@/components/ui/Brand'
import { Logo } from '@/components/ui/Logo'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { NotificationsMenu } from '@/components/ui/NotificationsMenu'
import { MapView } from '@/components/ui/MapView'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { SectionTitle } from '@/components/ui/SectionTitle'
import { EmptyState } from '@/components/ui/EmptyState'
import { TeacherHome } from '@/pages/teacher/TeacherHome'

const todayLine = new Date().toLocaleDateString('pt-BR', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
})

export function Home() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const setItems = useNotificationStore((s) => s.setItems)

  // Teachers get the management dashboard instead of the student journey.
  const isTeacher = user?.role === 'teacher'

  useEffect(() => {
    if (isTeacher) return
    setItems([
      {
        id: 'presence',
        title: 'Confirme sua presença',
        description: 'Registre a aula de hoje.',
        to: '/presence',
      },
      {
        id: 'payment',
        title: 'Mensalidade',
        description: 'Mantenha seu plano em dia.',
        to: '/payment',
      },
    ])
  }, [isTeacher, setItems])

  if (isTeacher) return <TeacherHome />

  return <StudentHome firstName={titleCase((user?.name ?? 'Atleta').split(' ')[0])} navigate={navigate} />
}

function titleCase(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : s
}

interface StudentHomeProps {
  firstName: string
  navigate: ReturnType<typeof useNavigate>
}

/**
 * Wellhub-style student home: a single featured gym with one-tap check-in plus a
 * live map and "como chegar" directions. Centred on the athlete's own gym — no
 * multi-gym browsing — matching the reference mockup.
 */
function StudentHome({ firstName, navigate }: StudentHomeProps) {
  const gym = DEMO_GYM
  const gymPoint = { lat: gym.lat, lng: gym.lng }
  const { coords, status, request } = useUserLocation()

  const distance = useMemo(
    () => (coords ? formatDistance(haversineMeters(coords, gymPoint)) : null),
    [coords, gymPoint],
  )

  // Not enrolled in any gym yet → guide the student to a join link.
  if (!PREVIEW_MODE) {
    return (
      <div className="flex flex-col">
        <TopBar />
        <div className="flex flex-col gap-5 px-5 pb-6 pt-2">
          <Greeting firstName={firstName} />
          <EmptyState
            icon={Building2}
            message="Você ainda não está em nenhuma academia."
            action={{ label: 'Inserir convite', onClick: () => navigate('/invite') }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <TopBar />

      <div className="flex flex-col gap-5 px-5 pb-8 pt-2">
        <Greeting firstName={firstName} />

        {/* Featured gym — one-tap check-in */}
        <Card className="relative flex flex-col gap-4 overflow-hidden">
          <span className="absolute right-0 top-0 rounded-bl-2xl bg-emerald-500 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white">
            Matrícula ativa
          </span>

          <div className="flex items-center gap-3.5 pr-24">
            <Logo size={56} rounded="rounded-2xl" />
            <div className="min-w-0">
              <h2 className="truncate font-display text-lg font-extrabold uppercase tracking-tight text-content">
                {gym.name}
              </h2>
              <p className="truncate text-sm text-muted">{gym.modality}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Stat icon={Clock} label="Próxima aula" value={gym.nextClass} />
            <Stat icon={Flame} label="Presenças no mês" value={String(gym.attendanceMonth)} />
          </div>

          <Button onClick={() => navigate('/presence')}>
            <CalendarCheck size={18} /> Fazer check-in
          </Button>
        </Card>

        {/* Map + directions to the athlete's own gym */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <SectionTitle underline>Como chegar</SectionTitle>
            {distance && (
              <span className="text-xs font-semibold text-muted">{distance} de você</span>
            )}
          </div>

          <MapView
            point={gymPoint}
            label={gym.name}
            distance={distance ?? undefined}
            onOpen={() => openDirections(gymPoint)}
          />

          <div className="flex items-start gap-2.5 px-1 text-sm">
            <MapPin size={16} className="mt-0.5 shrink-0 text-primary" />
            <p className="text-muted">
              <span className="font-semibold text-content">{gym.address}</span>
              <br />
              {gym.city}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button onClick={() => openDirections(gymPoint)}>
              <Navigation size={17} /> Traçar rota
            </Button>
            <Button
              variant="secondary"
              loading={status === 'loading'}
              onClick={request}
            >
              <LocateFixed size={17} />
              {status === 'granted' ? 'Atualizar' : 'Minha distância'}
            </Button>
          </div>

          {status === 'denied' && (
            <p className="px-1 text-xs text-muted">
              Não foi possível acessar sua localização. Você ainda pode traçar a rota no mapa.
            </p>
          )}
        </section>

        {/* Quick actions */}
        <section className="flex flex-col gap-3">
          <SectionTitle>Ações rápidas</SectionTitle>
          <QuickAction
            icon={GraduationCap}
            title="Aulas e conteúdos"
            subtitle="Veja o conteúdo e os vídeos das aulas."
            onClick={() => navigate('/aulas')}
          />
          <QuickAction
            icon={CreditCard}
            title="Mensalidade"
            subtitle="Pague pela Abacate Pay."
            onClick={() => navigate('/payment')}
          />
          <QuickAction
            icon={Building2}
            title="Entrar em outra academia"
            subtitle="Use um novo link de convite."
            onClick={() => navigate('/invite')}
          />
        </section>
      </div>
    </div>
  )
}

/** Mobile top bar (brand + theme + notifications); hidden on desktop sidebar. */
function TopBar() {
  return (
    <div className="flex h-14 items-center justify-between px-5 pt-safe lg:hidden">
      <Brand size={30} wordmarkClassName="text-base text-content" />
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <NotificationsMenu />
      </div>
    </div>
  )
}

function Greeting({ firstName }: { firstName: string }) {
  return (
    <div>
      <p className="text-sm font-medium capitalize text-muted">{todayLine}</p>
      <h1 className="mt-1 font-display text-[26px] font-extrabold leading-tight tracking-tight text-content">
        Continue assim, {firstName}! 🔥
      </h1>
    </div>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl bg-canvas px-3 py-2.5">
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
        <Icon size={12} className="text-primary" /> {label}
      </p>
      <p className="mt-0.5 truncate text-sm font-bold text-content">{value}</p>
    </div>
  )
}

function QuickAction({
  icon: Icon,
  title,
  subtitle,
  onClick,
}: {
  icon: typeof Clock
  title: string
  subtitle: string
  onClick: () => void
}) {
  return (
    <button onClick={onClick} className="w-full text-left">
      <Card interactive className="flex items-center gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-ink text-white dark:bg-white/10">
          <Icon size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-[15px] font-bold uppercase tracking-tight text-content">
            {title}
          </h3>
          <p className="text-sm text-muted">{subtitle}</p>
        </div>
        <ChevronRight size={20} className="shrink-0 text-neutral-300" />
      </Card>
    </button>
  )
}
