import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LogOut,
  GraduationCap,
  UserRound,
  Mail,
  FileText,
  MapPin,
  Building2,
  RefreshCw,
} from 'lucide-react'
import { getErrorMessage } from '@/lib/api'
import { fetchProfile } from '@/lib/auth'
import { useAuthStore } from '@/store/authStore'
import { useGymStore } from '@/store/gymStore'
import { PREVIEW_MODE } from '@/lib/preview'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { Header } from '@/components/layout/Header'
import { FormLayout } from '@/components/layout/FormLayout'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { FormError } from '@/components/ui/FormError'
import { maskCpf, maskCnpj, maskCep } from '@/lib/format'

const VINCULO_LABEL: Record<string, string> = {
  professor: 'Professor',
  instrutor: 'Instrutor',
  aluno: 'Aluno',
}

/**
 * Profile screen. The backend has no profile-update endpoint, so the screen is
 * informative: it shows the data from GET /Users/Me (identity, role, belt and
 * the gyms the user belongs to) and offers logout + theme.
 */
export function Profile() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const logout = useAuthStore((s) => s.logout)
  const gym = useGymStore((s) => s.gym)

  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const isTeacher = user?.role === 'teacher'
  const isInstructor = user?.role === 'instructor'

  // Refresh the profile from the backend on entry (belt promotions, new gyms).
  useEffect(() => {
    if (PREVIEW_MODE) return
    fetchProfile()
      .then(setUser)
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleRefresh() {
    setError(null)
    setRefreshing(true)
    try {
      setUser(await fetchProfile())
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível atualizar o perfil.'))
    } finally {
      setRefreshing(false)
    }
  }

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  const academias = user?.academias ?? []

  return (
    <div className="flex flex-col">
      <Header
        title="Perfil"
        subtitle="Seus dados e preferências da conta."
        back={false}
      />

      <FormLayout
        aside={
          <>
            {/* Identity card */}
            <Card className="flex items-center gap-4">
              <Avatar
                name={user?.name ?? user?.email}
                accent={isTeacher}
                size="h-16 w-16 text-2xl"
              />
              <div className="min-w-0">
                <h2 className="truncate font-display text-lg font-bold uppercase tracking-tight text-content">
                  {user?.name ?? 'Atleta'}
                </h2>
                <p className="truncate text-sm text-muted">{user?.email}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <Badge tone={isTeacher || isInstructor ? 'primary' : 'ink'}>
                    {isTeacher ? 'Professor' : isInstructor ? 'Instrutor' : 'Aluno'}
                  </Badge>
                  {user?.faixa && <Badge tone="soft">Faixa {user.faixa}</Badge>}
                </div>
              </div>
            </Card>

            {/* Teacher gym summary */}
            {isTeacher && gym && (
              <Card className="flex flex-col gap-2.5">
                <p className="text-xs font-bold uppercase tracking-wide text-muted">
                  Minha academia
                </p>
                <SummaryRow label="Academia" value={gym.name ?? '—'} />
                {gym.cnpj && <SummaryRow label="CNPJ" value={maskCnpj(gym.cnpj)} />}
                {gym.city && <SummaryRow label="Local" value={gym.city} />}
              </Card>
            )}

            {/* Preview-only role switcher (browse student + teacher flows). */}
            {PREVIEW_MODE && (
              <div className="rounded-2xl border border-dashed border-line bg-surface p-3">
                <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
                  Modo de visualização · trocar papel
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { role: 'student' as const, label: 'Aluno', icon: UserRound },
                      { role: 'teacher' as const, label: 'Professor', icon: GraduationCap },
                    ]
                  ).map(({ role, label, icon: Icon }) => {
                    const selected = (user?.role ?? 'student') === role
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => user && setUser({ ...user, role })}
                        className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                          selected
                            ? 'bg-primary text-white shadow-primary'
                            : 'bg-canvas text-muted hover:text-content'
                        }`}
                      >
                        <Icon size={17} />
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Appearance */}
            <ThemeToggle variant="bar" />
          </>
        }
      >
        {/* Account data (read-only — the backend has no profile-update endpoint) */}
        <Card className="flex flex-col gap-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">
            Dados da conta
          </p>
          <InfoRow icon={UserRound} label="Nome" value={user?.name} />
          <InfoRow icon={Mail} label="E-mail" value={user?.email} />
          <InfoRow
            icon={FileText}
            label="CPF"
            value={user?.cpf ? maskCpf(user.cpf) : undefined}
          />
          <InfoRow
            icon={MapPin}
            label="CEP"
            value={user?.cep ? maskCep(user.cep) : undefined}
          />
          {user?.faixa && (
            <InfoRow icon={GraduationCap} label="Graduação" value={`Faixa ${user.faixa}`} />
          )}
        </Card>

        {/* Gyms the user belongs to (GET /Users/Me → academias) */}
        <Card className="flex flex-col gap-3">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">
            Minhas academias
          </p>
          {academias.length === 0 ? (
            <p className="text-sm text-muted">
              Você ainda não participa de nenhuma academia.
            </p>
          ) : (
            academias.map((a) => (
              <div
                key={`${a.id}-${a.vinculo}`}
                className="flex items-center gap-3 rounded-xl border border-line bg-canvas px-3.5 py-3"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink text-white dark:bg-white/10">
                  <Building2 size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-content">{a.nome}</p>
                  <p className="truncate text-xs text-muted">
                    {a.cnpj ? `CNPJ ${maskCnpj(a.cnpj)}` : '—'}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Badge tone={a.vinculo === 'aluno' ? 'ink' : 'primary'}>
                    {VINCULO_LABEL[a.vinculo] ?? a.vinculo}
                  </Badge>
                  {a.faixa && <Badge tone="soft">Faixa {a.faixa}</Badge>}
                </div>
              </div>
            ))
          )}
        </Card>

        {error && <FormError>{error}</FormError>}

        <Button variant="secondary" loading={refreshing} onClick={handleRefresh}>
          <RefreshCw size={17} />
          Atualizar dados
        </Button>
        <Button variant="secondary" onClick={handleLogout}>
          <LogOut size={18} />
          Sair
        </Button>
      </FormLayout>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-muted">{label}</span>
      <span className="truncate text-sm font-semibold text-content">{value}</span>
    </div>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail
  label: string
  value?: string
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon size={16} className="mt-0.5 shrink-0 text-muted" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
          {label}
        </p>
        <p className="truncate text-sm text-content">{value ?? '—'}</p>
      </div>
    </div>
  )
}
