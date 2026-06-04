import { useNavigate } from 'react-router-dom'
import {
  Building2,
  CalendarCheck,
  CreditCard,
  Plus,
  ChevronRight,
  Clock,
} from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { SectionTitle } from '@/components/ui/SectionTitle'
import { EmptyState } from '@/components/ui/EmptyState'
import { PREVIEW_MODE } from '@/lib/preview'
import { DEMO_GYM } from '@/lib/demo'

interface ActionCardProps {
  icon: typeof Building2
  title: string
  subtitle: string
  onClick: () => void
}

function ActionCard({ icon: Icon, title, subtitle, onClick }: ActionCardProps) {
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

/**
 * "Academias" tab for students. The backend has no list-my-gyms endpoint in the
 * authoritative map yet, so the list shows an empty state; quick actions reach
 * the presence and payment flows.
 */
export function MyGyms() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col">
      <Header
        title="Academias"
        subtitle="Suas academias e ações rápidas do dia."
        back={false}
      />

      <div className="flex flex-col gap-6 px-6 py-6">
        <section>
          <SectionTitle underline className="mb-3">
            Minhas academias
          </SectionTitle>
          {PREVIEW_MODE ? (
            <Card className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-ink text-white dark:bg-white/10">
                  <Building2 size={22} />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-display text-base font-bold uppercase tracking-tight text-content">
                    {DEMO_GYM.name}
                  </h3>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <Badge tone="ink">{DEMO_GYM.belt}</Badge>
                    <Badge tone="success">Mensalidade em dia</Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-line pt-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                    Plano
                  </p>
                  <p className="text-sm font-semibold text-content">
                    {DEMO_GYM.plan}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                    Presenças no mês
                  </p>
                  <p className="text-sm font-semibold text-content">
                    {DEMO_GYM.attendanceMonth}
                  </p>
                </div>
              </div>

              <button
                onClick={() => navigate('/presence')}
                className="flex items-center gap-2 rounded-2xl bg-primary-soft px-4 py-3 text-left text-sm font-semibold text-primary transition-colors hover:bg-primary/15"
              >
                <Clock size={16} />
                Próxima aula · {DEMO_GYM.nextClass}
                <ChevronRight size={16} className="ml-auto" />
              </button>
            </Card>
          ) : (
            <EmptyState
              icon={Building2}
              message="Você ainda não está em nenhuma academia."
              action={{ label: 'Inserir convite', onClick: () => navigate('/invite') }}
            />
          )}
        </section>

        <section>
          <SectionTitle className="mb-3">Ações rápidas</SectionTitle>
          <div className="flex flex-col gap-3">
            <ActionCard
              icon={CalendarCheck}
              title="Confirmar presença"
              subtitle="Registre sua presença na aula de hoje."
              onClick={() => navigate('/presence')}
            />
            <ActionCard
              icon={CreditCard}
              title="Mensalidade"
              subtitle="Pague sua mensalidade pela Abacate Pay."
              onClick={() => navigate('/payment')}
            />
            <ActionCard
              icon={Plus}
              title="Entrar em outra academia"
              subtitle="Use um novo link de convite."
              onClick={() => navigate('/invite')}
            />
          </div>
        </section>
      </div>
    </div>
  )
}
