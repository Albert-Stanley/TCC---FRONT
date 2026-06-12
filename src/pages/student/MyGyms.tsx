import { useNavigate } from 'react-router-dom'
import {
  Building2,
  CalendarCheck,
  CreditCard,
  Plus,
  ChevronRight,
  Clock,
  GraduationCap,
} from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { SectionTitle } from '@/components/ui/SectionTitle'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAuthStore } from '@/store/authStore'
import { PREVIEW_MODE } from '@/lib/preview'
import { DEMO_GYM } from '@/lib/demo'
import { maskCnpj } from '@/lib/format'

const VINCULO_LABEL: Record<string, string> = {
  professor: 'Professor',
  instrutor: 'Instrutor',
  aluno: 'Aluno',
}

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
 * "Academias" tab for students: lists the gyms the user belongs to (from
 * GET /Users/Me → academias) plus quick actions to presence and payment.
 */
export function MyGyms() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const academias = user?.academias ?? []

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

              <button
                onClick={() => navigate('/presence')}
                className="flex items-center gap-2 rounded-2xl bg-primary-soft px-4 py-3 text-left text-sm font-semibold text-primary transition-colors hover:bg-primary/15"
              >
                <Clock size={16} />
                Próxima aula · {DEMO_GYM.nextClass}
                <ChevronRight size={16} className="ml-auto" />
              </button>
            </Card>
          ) : academias.length === 0 ? (
            <div className="flex flex-col gap-3">
              <EmptyState
                icon={Building2}
                message="Você ainda não está em nenhuma academia."
                action={{ label: 'Inserir convite', onClick: () => navigate('/invite') }}
              />
              <button
                onClick={() => navigate('/gyms/new')}
                className="text-center text-sm font-semibold text-primary"
              >
                Sou professor — criar minha academia
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {academias.map((a) => (
                <Card key={`${a.id}-${a.vinculo}`} className="flex flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-ink text-white dark:bg-white/10">
                      <Building2 size={22} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-display text-base font-bold uppercase tracking-tight text-content">
                        {a.nome}
                      </h3>
                      <p className="truncate text-xs text-muted">
                        {a.cnpj ? `CNPJ ${maskCnpj(a.cnpj)}` : '—'}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <Badge tone={a.vinculo === 'aluno' ? 'ink' : 'primary'}>
                          {VINCULO_LABEL[a.vinculo] ?? a.vinculo}
                        </Badge>
                        {a.faixa && <Badge tone="soft">Faixa {a.faixa}</Badge>}
                      </div>
                    </div>
                  </div>

                  {a.vinculo === 'aluno' && (
                    <button
                      onClick={() => navigate('/presence')}
                      className="flex items-center gap-2 rounded-2xl bg-primary-soft px-4 py-3 text-left text-sm font-semibold text-primary transition-colors hover:bg-primary/15"
                    >
                      <CalendarCheck size={16} />
                      Confirmar presença de hoje
                      <ChevronRight size={16} className="ml-auto" />
                    </button>
                  )}
                </Card>
              ))}
            </div>
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
              icon={GraduationCap}
              title="Aulas"
              subtitle="Veja as aulas de hoje na sua academia."
              onClick={() => navigate('/aulas')}
            />
            <ActionCard
              icon={CreditCard}
              title="Mensalidade"
              subtitle="Pague sua mensalidade com segurança pela Stripe."
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
