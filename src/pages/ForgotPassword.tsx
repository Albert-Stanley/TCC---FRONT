import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { api, getErrorMessage } from '@/lib/api'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Header } from '@/components/layout/Header'
import { InfoNote } from '@/components/ui/InfoNote'
import { FormError } from '@/components/ui/FormError'
import { onlyDigits } from '@/lib/format'

/**
 * Password recovery in two steps:
 *  1. POST /Users/Password/Forgot { email }            → e-mails a 6-digit code
 *  2. POST /Users/Password/Reset  { codigo_auth, nova_senha }
 */
export function ForgotPassword() {
  const navigate = useNavigate()

  const [step, setStep] = useState<1 | 2>(1)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleRequest(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await api.post('/Users/Password/Forgot', { email })
      setStep(2)
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível enviar o código.'))
    } finally {
      setLoading(false)
    }
  }

  async function handleReset(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await api.post('/Users/Password/Reset', {
        codigo_auth: code,
        nova_senha: password,
      })
      setDone(true)
    } catch (err) {
      setError(getErrorMessage(err, 'Código inválido ou expirado.'))
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="flex min-h-full flex-1 flex-col bg-surface">
        <Header title="KRAVCONNECT" backTo="/login" />
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center px-6 py-12 text-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={38} />
          </span>
          <h1 className="mt-5 font-display text-2xl font-extrabold uppercase tracking-tight text-content">
            Senha redefinida!
          </h1>
          <p className="mt-2 text-sm text-muted">
            Sua nova senha já está valendo. Entre novamente para continuar.
          </p>
          <div className="mt-8 w-full">
            <Button onClick={() => navigate('/login', { replace: true })}>
              Ir para o login
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-surface">
      <Header title="KRAVCONNECT" backTo="/login" />

      <div className="flex flex-1 flex-col px-6 py-8">
        <header className="mb-7">
          <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight text-content">
            {step === 1 ? 'Esqueci minha senha' : 'Redefinir senha'}
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            {step === 1
              ? 'Informe o e-mail da sua conta para receber o código.'
              : 'Digite o código recebido por e-mail e escolha a nova senha.'}
          </p>
        </header>

        {step === 1 ? (
          <form onSubmit={handleRequest} className="flex flex-col gap-5">
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

            {error && <FormError>{error}</FormError>}

            <Button type="submit" loading={loading} className="mt-1">
              Enviar código
            </Button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="flex flex-col gap-5">
            <Input
              name="code"
              label="Código de verificação"
              placeholder="000000"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              value={code}
              onChange={(e) => setCode(onlyDigits(e.target.value))}
            />
            <Input
              name="password"
              type={showPassword ? 'text' : 'password'}
              label="Nova senha"
              placeholder="••••••••"
              autoComplete="new-password"
              minLength={6}
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

            <InfoNote>
              O código foi enviado para <strong>{email}</strong>. Verifique
              também a caixa de spam.
            </InfoNote>

            {error && <FormError>{error}</FormError>}

            <Button type="submit" loading={loading} className="mt-1">
              Redefinir senha
            </Button>
            <button
              type="button"
              onClick={() => {
                setError(null)
                setStep(1)
              }}
              className="text-center text-sm font-medium text-muted"
            >
              Reenviar código
            </button>
          </form>
        )}

        <p className="mt-auto pt-8 text-center text-sm text-muted">
          Lembrou a senha?{' '}
          <Link
            to="/login"
            className="font-bold uppercase tracking-wide text-primary"
          >
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
