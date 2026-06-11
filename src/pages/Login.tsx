import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { api, getErrorMessage } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { fetchProfile } from '@/lib/auth'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { FormError } from '@/components/ui/FormError'

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
    <AuthLayout
      title="Bem-vindo de volta"
      subtitle="Acesse sua conta para continuar."
      footer={
        <>
          Não tem conta?{' '}
          <Link
            to="/register"
            className="font-bold uppercase tracking-wide text-primary"
          >
            Cadastre-se
          </Link>
        </>
      }
    >
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

        <div className="-mt-2 flex justify-end">
          <Link
            to="/forgot-password"
            className="text-sm font-semibold text-primary"
          >
            Esqueci minha senha
          </Link>
        </div>

        {error && <FormError>{error}</FormError>}

        <Button type="submit" loading={loading} className="mt-1">
          Entrar
        </Button>
      </form>
    </AuthLayout>
  )
}
