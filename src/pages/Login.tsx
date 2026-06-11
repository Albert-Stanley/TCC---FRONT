import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { api, getErrorMessage } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { fetchProfile } from '@/lib/auth'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Brand } from '@/components/ui/Brand'
import { Logo } from '@/components/ui/Logo'
import { FormError } from '@/components/ui/FormError'

export function Login() {
  const navigate = useNavigate()
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
      navigate('/home', { replace: true })
    } catch (err) {
      setError(getErrorMessage(err, 'E-mail ou senha inválidos.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-surface">
      {/* Dark brand hero */}
      <div className="pt-safe relative overflow-hidden bg-gradient-to-b from-ink to-ink-soft px-6 pb-10 pt-10 text-white">
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

      <div className="-mt-5 flex flex-1 flex-col rounded-t-3xl bg-surface px-6 pb-8 pt-8">
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

          {error && <FormError>{error}</FormError>}

          <Button type="submit" loading={loading} className="mt-2">
            Entrar
          </Button>
        </form>

        <p className="mt-auto pt-10 text-center text-sm text-muted">
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
  )
}
