import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { api, getErrorMessage } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Header } from '@/components/layout/Header'
import { InfoNote } from '@/components/ui/InfoNote'
import { FormError } from '@/components/ui/FormError'
import { maskCep, maskCpf, onlyDigits } from '@/lib/format'
import type { AuthResponse, RegistrationPayload } from '@/types'

/** Two-step indicator shown at the top of the registration form. */
function Stepper() {
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
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-surface text-xs font-bold text-muted">
          2
        </span>
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">
          Confirmação
        </span>
      </div>
    </div>
  )
}

export function Register() {
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [cpf, setCpf] = useState('')
  const [cep, setCep] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

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
      const payload: RegistrationPayload = {
        name,
        email,
        password,
        cpf: onlyDigits(cpf),
        cep: onlyDigits(cep),
      }
      const { data } = await api.post<AuthResponse>(
        '/users/registration',
        payload,
      )

      // If the backend already returns a token, log the user straight in.
      if (data?.token) {
        setSession(data.token, data.user ?? null)
        navigate('/home', { replace: true })
      } else {
        navigate('/login', { replace: true })
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível concluir o cadastro.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-surface">
      <Header title="KRAVCONNECT" backTo="/login" />

      <div className="flex flex-1 flex-col px-6 py-8">
        <header className="mb-7">
          <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight text-content">
            Crie sua conta
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            Preencha seus dados para começar.
          </p>
        </header>

        <Stepper />

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
          <Input
            name="cep"
            label="CEP"
            placeholder="00000-000"
            inputMode="numeric"
            required
            value={cep}
            onChange={(e) => setCep(maskCep(e.target.value))}
          />

          <InfoNote>
            Usaremos seu CPF e CEP para validar seu cadastro na academia.
          </InfoNote>

          {error && <FormError>{error}</FormError>}

          <Button type="submit" loading={loading} className="mt-1">
            Continuar
          </Button>
        </form>

        <p className="mt-auto pt-8 text-center text-sm text-muted">
          Já tem conta?{' '}
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
