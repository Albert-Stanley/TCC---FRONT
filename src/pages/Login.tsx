import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Eye,
  EyeOff,
  MapPin,
  Users,
  GraduationCap,
  ShoppingBag,
} from 'lucide-react'
import { api, getErrorMessage } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { fetchProfile } from '@/lib/auth'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Brand } from '@/components/ui/Brand'
import { Logo } from '@/components/ui/Logo'
import { FormError } from '@/components/ui/FormError'

const FEATURES = [
  { icon: MapPin, text: 'Check-in por GPS direto do tatame' },
  { icon: GraduationCap, text: 'Aulas e graduações organizadas por faixa' },
  { icon: Users, text: 'Gestão completa de alunos para professores' },
  { icon: ShoppingBag, text: 'Loja de equipamentos da sua academia' },
]

export function Login() {
  const navigate = useNavigate()
  // Set by ProtectedRoute when an unauthenticated user followed a deep link
  // (e.g. an invite); after login they resume where they were heading.
  const from = (useLocation().state as { from?: string } | null)?.from
  const setSession = useAuthStore((s) => s.setSession)
  const setUser = useAuthStore((s) => s.setUser)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { data: token } = await api.post<string>('/Users/Auth', {
        email,
        senha: password,
      })
      if (!token || typeof token !== 'string') {
        throw new Error('O servidor não retornou um token de acesso.')
      }
      setSession(token)
      setUser(await fetchProfile())
      navigate(from ?? '/home', { replace: true })
    } catch (err) {
      setError(getErrorMessage(err, 'E-mail ou senha inválidos.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-full flex-1 bg-surface">
      {/* Brand panel — desktop only, fills the otherwise-empty left side. */}
      <div className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-gradient-to-br from-ink to-ink-soft p-12 text-white lg:flex">
        <Brand size={34} wordmarkClassName="text-xl text-white" />

        <div className="max-w-md">
          <Logo size={72} rounded="rounded-3xl" className="shadow-card" />
          <h1 className="mt-8 font-display text-4xl font-extrabold uppercase leading-tight tracking-tight">
            Sua academia de Krav Maga em um só lugar
          </h1>
          <p className="mt-4 text-base text-white/60">
            Presença, aulas, graduações e mensalidade — para alunos e
            professores.
          </p>

          <ul className="mt-10 flex flex-col gap-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-primary">
                  <Icon size={19} />
                </span>
                <span className="text-sm font-medium text-white/85">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-white/40">
          KravConnect · gestão de academias de Krav Maga
        </p>

        {/* Decorative glows */}
        <span className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary/25 blur-3xl" />
        <span className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
      </div>

      {/* Form side */}
      <div className="flex min-h-full w-full flex-col lg:max-w-xl">
        {/* Mobile-only dark hero (the desktop has the brand panel instead). */}
        <div className="pt-safe relative overflow-hidden bg-gradient-to-b from-ink to-ink-soft px-6 pb-10 pt-10 text-white lg:hidden">
          <Brand size={30} wordmarkClassName="text-lg text-white" />
          <div className="mt-10 flex flex-col items-center text-center">
            <Logo size={88} rounded="rounded-3xl" className="shadow-card" />
            <h1 className="mt-6 font-display text-2xl font-extrabold uppercase tracking-tight">
              Bem-vindo de volta
            </h1>
            <p className="mt-1.5 text-sm text-white/60">
              Acesse sua conta para continuar.
            </p>
          </div>
          <span className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-primary/20 blur-3xl" />
        </div>

        <div className="-mt-5 flex flex-1 flex-col rounded-t-3xl bg-surface px-6 pb-8 pt-8 lg:mt-0 lg:justify-center lg:rounded-none lg:px-16">
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col lg:flex-none">
            {/* Desktop heading (mobile shows it in the hero above). */}
            <header className="mb-8 hidden lg:block">
              <h2 className="font-display text-3xl font-extrabold uppercase tracking-tight text-content">
                Bem-vindo de volta
              </h2>
              <p className="mt-2 text-sm text-muted">
                Acesse sua conta para continuar.
              </p>
            </header>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
              <div>
                <Input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  label="Senha"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  rightSlot={
                    <button
                      type="button"
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      onClick={() => setShowPassword((v) => !v)}
                      className="flex items-center"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  }
                />
              </div>

              <div className="-mt-2 flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-sm font-semibold text-primary"
                >
                  Esqueci minha senha
                </Link>
              </div>

              {error && <FormError>{error}</FormError>}

              <Button type="submit" loading={loading} className="mt-2">
                Entrar
              </Button>
            </form>

            <p className="mt-auto pt-10 text-center text-sm text-muted lg:mt-0">
              Não tem conta?{' '}
              <Link
                to="/register"
                className="font-bold uppercase tracking-wide text-primary"
              >
                Cadastre-se
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
