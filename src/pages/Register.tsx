import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, MapPin } from 'lucide-react'
import { api, getErrorMessage } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { fetchProfile } from '@/lib/auth'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { InfoNote } from '@/components/ui/InfoNote'
import { FormError } from '@/components/ui/FormError'
import { maskCep, maskCpf, onlyDigits } from '@/lib/format'
import { lookupCep } from '@/lib/geo'

/** Two-step indicator shown at the top of the registration form. */
function Stepper({ current }: { current: 1 | 2 }) {
  const step2 = current === 2
  return (
    <div className="mb-8 flex items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white shadow-primary">
          1
        </span>
        <span className="text-xs font-semibold uppercase tracking-wide text-content">
          Dados
        </span>
      </div>
      <span className="h-1 flex-1 rounded-full bg-gradient-to-r from-primary to-line" />
      <div className="flex items-center gap-2">
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
            step2
              ? 'bg-primary text-white shadow-primary'
              : 'border border-line bg-surface text-muted'
          }`}
        >
          2
        </span>
        <span
          className={`text-xs font-semibold uppercase tracking-wide ${
            step2 ? 'text-content' : 'text-muted'
          }`}
        >
          Confirmação
        </span>
      </div>
    </div>
  )
}

export function Register() {
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)
  const setUser = useAuthStore((s) => s.setUser)

  const [step, setStep] = useState<1 | 2>(1)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [cpf, setCpf] = useState('')
  const [cep, setCep] = useState('')
  const [cepCity, setCepCity] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleCepChange(value: string) {
    setCep(maskCep(value))
    const digits = onlyDigits(value)
    if (digits.length !== 8) {
      setCepCity(null)
      return
    }
    const info = await lookupCep(digits)
    setCepCity(info?.city ? `${info.city} · ${info.uf ?? ''}`.trim() : null)
  }

  // Step 1: send the registration. The backend e-mails a 6-digit code and does
  // NOT create the account yet — that happens after confirmation.
  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    // Mirrors the backend rule (DominioEmailValido) to fail fast with a
    // friendlier message than the server's.
    if (!/@(gmail|hotmail|outlook)\./i.test(email)) {
      setError('Use um e-mail Gmail, Hotmail ou Outlook.')
      return
    }
    if (onlyDigits(cpf).length !== 11) {
      setError('Informe um CPF válido (11 dígitos).')
      return
    }
    if (onlyDigits(cep).length !== 8) {
      setError('Informe um CEP válido (8 dígitos).')
      return
    }

    setLoading(true)
    try {
      await api.post('/Users/Registration', {
        email,
        senha: password,
        cpf: onlyDigits(cpf),
        cep: onlyDigits(cep),
      })
      setStep(2)
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível concluir o cadastro.'))
    } finally {
      setLoading(false)
    }
  }

  // Step 2: confirm the code, then log straight in with the credentials used.
  async function handleConfirm(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await api.post('/Users/Registration/Confirm', { codigo_auth: code })
      const { data: token } = await api.post<string>('/Users/Auth', {
        email,
        senha: password,
      })
      if (token && typeof token === 'string') {
        setSession(token)
        setUser(await fetchProfile())
        navigate('/home', { replace: true })
      } else {
        navigate('/login', { replace: true })
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Código inválido ou expirado.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title={step === 1 ? 'Crie sua conta' : 'Confirme seu e-mail'}
      subtitle={
        step === 1
          ? 'Preencha seus dados para começar.'
          : 'Enviamos um código de 6 dígitos para o seu e-mail.'
      }
      footer={
        <>
          Já tem conta?{' '}
          <Link
            to="/login"
            className="font-bold uppercase tracking-wide text-primary"
          >
            Entrar
          </Link>
        </>
      }
    >
      <>
        <Stepper current={step} />

        {step === 1 ? (
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
            <Input
              name="cpf"
              label="CPF"
              placeholder="000.000.000-00"
              inputMode="numeric"
              required
              value={cpf}
              onChange={(e) => setCpf(maskCpf(e.target.value))}
            />
            <div>
              <Input
                name="cep"
                label="CEP"
                placeholder="00000-000"
                inputMode="numeric"
                required
                value={cep}
                onChange={(e) => handleCepChange(e.target.value)}
              />
              {cepCity && (
                <p className="mt-1.5 flex items-center gap-1.5 px-1 text-xs font-medium text-emerald-600">
                  <MapPin size={13} className="shrink-0" />
                  {cepCity}
                </p>
              )}
            </div>

            <InfoNote>
              Seu nome e seus dados pessoais são preenchidos automaticamente a
              partir do CPF. Use um e-mail Gmail, Hotmail ou Outlook.
            </InfoNote>

            {error && <FormError>{error}</FormError>}

            <Button type="submit" loading={loading} className="mt-1">
              Continuar
            </Button>
          </form>
        ) : (
          <form onSubmit={handleConfirm} className="flex flex-col gap-5">
            <Input
              name="code"
              label="Código de confirmação"
              placeholder="000000"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              value={code}
              onChange={(e) => setCode(onlyDigits(e.target.value))}
            />

            <InfoNote>
              O código foi enviado para <strong>{email}</strong>. Verifique
              também a caixa de spam.
            </InfoNote>

            {error && <FormError>{error}</FormError>}

            <Button type="submit" loading={loading} className="mt-1">
              Confirmar e entrar
            </Button>
            <button
              type="button"
              onClick={() => {
                setError(null)
                setStep(1)
              }}
              className="text-center text-sm font-medium text-muted"
            >
              Voltar e corrigir dados
            </button>
          </form>
        )}
      </>
    </AuthLayout>
  )
}
