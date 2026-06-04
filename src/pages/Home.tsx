import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, LogIn, ChevronRight } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useNotificationStore } from '@/store/notificationStore'
import { PREVIEW_MODE } from '@/lib/preview'
import { DEMO_GYM } from '@/lib/demo'
import { Brand } from '@/components/ui/Brand'
import { Hero } from '@/components/ui/Hero'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { NotificationsMenu } from '@/components/ui/NotificationsMenu'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { SectionTitle } from '@/components/ui/SectionTitle'
import { EmptyState } from '@/components/ui/EmptyState'
import { TeacherHome } from '@/pages/teacher/TeacherHome'

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

  const firstName = (user?.name ?? 'Atleta').split(' ')[0].toUpperCase()

  return (
    <div className="flex flex-col">
      <Hero
        flourish="dumbbell"
        topBar={
          <>
            <Brand size={32} wordmarkClassName="text-lg text-white" />
            <div className="flex items-center gap-1">
              <ThemeToggle className="hover:bg-white/10" />
              <NotificationsMenu className="hover:bg-white/10" />
            </div>
          </>
        }
      >
        <Badge tone="primary" className="mt-3">
          Bem-vindo
        </Badge>
        <h1 className="mt-3 font-display text-3xl font-extrabold uppercase leading-none tracking-tight">
          Olá, {firstName}.
        </h1>
        <p className="mt-2 text-sm text-white/60">O que você quer fazer hoje?</p>
      </Hero>

      {/* Actions + content */}
      <div className="-mt-4 flex flex-col gap-4 rounded-t-3xl bg-canvas px-6 pb-6 pt-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <button onClick={() => navigate('/invite')} className="text-left">
            <Card interactive className="flex items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-primary">
                <LogIn size={22} />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-[15px] font-bold uppercase tracking-tight text-content">
                  Entrar em academia
                </h3>
                <p className="text-sm text-muted">Use o link do seu professor.</p>
              </div>
              <ChevronRight size={20} className="shrink-0 text-neutral-300" />
            </Card>
          </button>

          <button onClick={() => navigate('/gyms/new')} className="text-left">
            <Card interactive className="flex items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-ink text-white dark:bg-white/10">
                <Building2 size={22} />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-[15px] font-bold uppercase tracking-tight text-content">
                  Criar academia
                </h3>
                <p className="text-sm text-muted">Cadastre sua própria academia.</p>
              </div>
              <ChevronRight size={20} className="shrink-0 text-neutral-300" />
            </Card>
          </button>
        </div>

        <section className="mt-2">
          <SectionTitle underline className="mb-3">
            Minhas academias
          </SectionTitle>
          {PREVIEW_MODE ? (
            <button onClick={() => navigate('/gyms')} className="w-full text-left">
              <Card interactive className="flex items-center gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-ink text-white dark:bg-white/10">
                  <Building2 size={22} />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-display text-[15px] font-bold uppercase tracking-tight text-content">
                    {DEMO_GYM.name}
                  </h3>
                  <p className="text-sm text-muted">
                    {DEMO_GYM.belt} · {DEMO_GYM.nextClass}
                  </p>
                </div>
                <Badge tone="success">Em dia</Badge>
              </Card>
            </button>
          ) : (
            <EmptyState
              icon={Building2}
              message="Você ainda não está em nenhuma academia."
              action={{ label: 'Entrar agora', onClick: () => navigate('/invite') }}
            />
          )}
        </section>
      </div>
    </div>
  )
}
