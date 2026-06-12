import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarCheck,
  CreditCard,
  Navigation,
  Clock,
  Award,
  ChevronRight,
  LocateFixed,
  Building2,
  GraduationCap,
} from 'lucide-react'
import { api, asList } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useNotificationStore } from '@/store/notificationStore'
import { enrolledGym } from '@/lib/auth'
import { PREVIEW_MODE } from '@/lib/preview'
import { DEMO_GYM } from '@/lib/demo'
import { formatTime } from '@/lib/format'
import {
  openDirections,
  haversineMeters,
  formatDistance,
  useUserLocation,
  useGymLocation,
} from '@/lib/geo'
import { Brand } from '@/components/ui/Brand'
import { Logo } from '@/components/ui/Logo'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { NotificationsMenu } from '@/components/ui/NotificationsMenu'
import { MapView } from '@/components/ui/MapView'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { SectionTitle } from '@/components/ui/SectionTitle'
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
 * Wellhub-style student home: the gym the athlete is enrolled in (from
 * GET /Users/Me → academias) with one-tap check-in, the real gym location from
 * GET /Gyms/Geolocation and today's next class from GET /Gyms/Classes/Day.
 */
function StudentHome({ firstName, navigate }: StudentHomeProps) {
  const user = useAuthStore((s) => s.user)
  const enrolled = PREVIEW_MODE ? undefined : enrolledGym(user)

  // Real gym anchor from GET /Gyms/Geolocation (registered by the teacher via
  // PUT /Gyms/Location); skipped while previewing or unenrolled.
  const registeredPoint = useGymLocation(!PREVIEW_MODE && Boolean(enrolled))
  const gymPoint = PREVIEW_MODE
    ? { lat: DEMO_GYM.lat, lng: DEMO_GYM.lng }
    : registeredPoint
  const [nextClass, setNextClass] = useState<string | null>(
    PREVIEW_MODE ? DEMO_GYM.nextClass : null,
  )
  const { coords, status, request } = useUserLocation()

  const gymName = enrolled?.nome ?? DEMO_GYM.name
  const faixa = enrolled?.faixa ?? user?.faixa

  // Today's classes (skipped while previewing or unenrolled).
  useEffect(() => {
    if (PREVIEW_MODE || !enrolled) return
    api
      .get('/Gyms/Classes/Day')
      .then(({ data }) => {
        const first = asList<{ data_aula?: string }>(data)[0]
        const time = formatTime(first?.data_aula)
        if (time) setNextClass(`Hoje, ${time}`)
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enrolled?.id])

  const distance = useMemo(
    () =>
      coords && gymPoint
        ? formatDistance(haversineMeters(coords, gymPoint))
        : null,
    [coords, gymPoint],
  )

  // No gym yet (GET /Users/Me → academias vazio) → onboarding: the user picks
  // between creating a gym (becomes the teacher) or joining one via invite.
  if (!PREVIEW_MODE && (user?.academias?.length ?? 0) === 0) {
    return <Onboarding firstName={firstName} navigate={navigate} />
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
                {gymName}
              </h2>
              <p className="truncate text-sm text-muted">
                Krav Maga · Defesa Pessoal
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Stat icon={Clock} label="Próxima aula" value={nextClass ?? 'Sem aulas hoje'} />
            <Stat icon={Award} label="Sua faixa" value={faixa ? `Faixa ${faixa}` : '—'} />
          </div>

          <Button onClick={() => navigate('/presence')}>
            <CalendarCheck size={18} /> Fazer check-in
          </Button>
        </Card>

        {/* Map + directions to the athlete's own gym (when it has a location) */}
        {gymPoint && (
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <SectionTitle underline>Como chegar</SectionTitle>
              {distance && (
                <span className="text-xs font-semibold text-muted">{distance} de você</span>
              )}
            </div>

            <MapView
              point={gymPoint}
              label={gymName}
              distance={distance ?? undefined}
              onOpen={() => openDirections(gymPoint)}
            />

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
        )}

        {/* Quick actions */}
        <section className="flex flex-col gap-3">
          <SectionTitle>Ações rápidas</SectionTitle>
          <QuickAction
            icon={GraduationCap}
            title="Aulas"
            subtitle="Veja as aulas de hoje na sua academia."
            onClick={() => navigate('/aulas')}
          />
          <QuickAction
            icon={CreditCard}
            title="Mensalidade"
            subtitle="Pague com segurança pela Stripe."
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

/**
 * First-session screen for accounts with no gym: choose between creating an
 * academy (the user becomes its teacher via POST /Gyms/Creation) or joining
 * one as a student with an invite code.
 */
function Onboarding({ firstName, navigate }: StudentHomeProps) {
  const OPTIONS = [
    {
      icon: GraduationCap,
      title: 'Sou professor',
      text: 'Crie sua academia, gere convites e gerencie alunos, faixas e aulas.',
      cta: 'Criar minha academia',
      to: '/gyms/new',
      featured: true,
    },
    {
      icon: Building2,
      title: 'Sou aluno',
      text: 'Recebeu um convite do seu professor? Use o link ou código para entrar.',
      cta: 'Inserir convite',
      to: '/invite',
      featured: false,
    },
  ]

  return (
    <div className="flex flex-col">
      <TopBar />
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 pb-10 pt-2">
        <div>
          <p className="text-sm font-medium capitalize text-muted">{todayLine}</p>
          <h1 className="mt-1 font-display text-[26px] font-extrabold leading-tight tracking-tight text-content">
            Bem-vindo, {firstName}! 👊
          </h1>
          <p className="mt-2 text-sm text-muted">
            Para começar, escolha como você vai usar o KravConnect.
          </p>
        </div>

        <div className="grid items-stretch gap-4 sm:grid-cols-2">
          {OPTIONS.map(({ icon: Icon, title, text, cta, to, featured }) => (
            <button
              key={to}
              onClick={() => navigate(to)}
              className="group flex w-full flex-col text-left"
            >
              <Card
                interactive
                className="flex flex-1 flex-col gap-4 p-5"
              >
                <span
                  className={`flex h-13 w-13 items-center justify-center rounded-2xl ${
                    featured
                      ? 'bg-primary text-white shadow-primary'
                      : 'bg-ink text-white dark:bg-white/10'
                  }`}
                >
                  <Icon size={24} />
                </span>
                <div className="flex-1">
                  <h2 className="font-display text-lg font-extrabold uppercase tracking-tight text-content">
                    {title}
                  </h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">
                    {text}
                  </p>
                </div>
                <span
                  className={`flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide ${
                    featured ? 'text-primary' : 'text-content'
                  }`}
                >
                  {cta}
                  <ChevronRight
                    size={17}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </span>
              </Card>
            </button>
          ))}
        </div>

        <p className="px-1 text-center text-xs text-muted">
          Criou a academia? Você se torna o professor responsável por ela.
          Entrou com convite? Seu pedido vai para a aprovação do professor.
        </p>
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
