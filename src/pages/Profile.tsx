import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, GraduationCap, UserRound, CheckCircle2 } from 'lucide-react'
import { api, getErrorMessage } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { PREVIEW_MODE } from '@/lib/preview'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { Header } from '@/components/layout/Header'
import { FormLayout } from '@/components/layout/FormLayout'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { FormError } from '@/components/ui/FormError'
import { maskCep, maskCpf, onlyDigits } from '@/lib/format'
import type { User } from '@/types'

export function Profile() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const logout = useAuthStore((s) => s.logout)

  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [cpf, setCpf] = useState(maskCpf(user?.cpf ?? ''))
  const [cep, setCep] = useState(maskCep(user?.cep ?? ''))
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const isTeacher = user?.role === 'teacher'

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSuccess(false)

    if (cpf && onlyDigits(cpf).length !== 11) {
      setError('Informe um CPF válido (11 dígitos).')
      return
    }
    if (cep && onlyDigits(cep).length !== 8) {
      setError('Informe um CEP válido (8 dígitos).')
      return
    }

    setLoading(true)
    try {
      const payload = {
        name,
        email,
        cpf: onlyDigits(cpf),
        cep: onlyDigits(cep),
      }
      const { data } = await api.put<User | { user?: User } | null>(
        '/users/update',
        payload,
      )
      // Merge whatever the server confirms back into the session user.
      const updated = (data && 'user' in data ? data.user : (data as User)) ?? null
      if (user) {
        setUser({ ...user, ...payload, ...(updated ?? {}) })
      }
      setSuccess(true)
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível salvar as alterações.'))
    } finally {
      setLoading(false)
    }
  }

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex flex-col">
      <Header
        title="Perfil"
        subtitle="Gerencie seus dados e preferências da conta."
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
                <Badge tone={isTeacher ? 'primary' : 'ink'} className="mt-1.5">
                  {isTeacher ? 'Professor' : 'Aluno'}
                </Badge>
              </div>
            </Card>

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
        {/* Edit form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Input
            name="name"
            label="Nome completo"
            placeholder="Seu nome"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            name="email"
            type="email"
            label="E-mail"
            placeholder="seu@email.com"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            name="cpf"
            label="CPF"
            placeholder="000.000.000-00"
            inputMode="numeric"
            value={cpf}
            onChange={(e) => setCpf(maskCpf(e.target.value))}
          />
          <Input
            name="cep"
            label="CEP"
            placeholder="00000-000"
            inputMode="numeric"
            value={cep}
            onChange={(e) => setCep(maskCep(e.target.value))}
          />

          {error && <FormError>{error}</FormError>}
          {success && (
            <p
              role="status"
              className="flex items-center gap-2.5 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-600"
            >
              <CheckCircle2 size={18} className="shrink-0" />
              Alterações salvas com sucesso.
            </p>
          )}

          <Button type="submit" loading={loading} className="mt-1">
            Salvar alterações
          </Button>
        </form>

        <Button variant="secondary" onClick={handleLogout}>
          <LogOut size={18} />
          Sair
        </Button>
      </FormLayout>
    </div>
  )
}
