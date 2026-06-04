import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, getErrorMessage } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useGymStore } from '@/store/gymStore'
import { Users, Link2, GraduationCap } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { FormLayout } from '@/components/layout/FormLayout'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { InfoNote } from '@/components/ui/InfoNote'
import { FormError } from '@/components/ui/FormError'
import { maskCnpj, onlyDigits } from '@/lib/format'
import type { Gym } from '@/types'

const PERKS = [
  { icon: Link2, text: 'Gere convites e adicione alunos.' },
  { icon: Users, text: 'Gerencie alunos, faixas e mensalidades.' },
  { icon: GraduationCap, text: 'Crie aulas com conteúdo e vídeos.' },
]

export function CreateGym() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const setGym = useGymStore((s) => s.setGym)

  const [name, setName] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (onlyDigits(cnpj).length !== 14) {
      setError('Informe um CNPJ válido (14 dígitos).')
      return
    }

    setLoading(true)
    try {
      // Backend verifies the CNPJ's partner against the CPF from the token.
      const payload = {
        cpf: onlyDigits(user?.cpf ?? ''),
        cnpj: onlyDigits(cnpj),
        name,
      }
      const { data } = await api.post<Gym | { gym?: Gym } | null>(
        '/Gym/Create',
        payload,
      )

      const created =
        (data && 'gym' in data ? data.gym : (data as Gym)) ?? null
      setGym({
        id: created?.id ?? onlyDigits(cnpj),
        name: created?.name ?? name,
        cnpj: created?.cnpj ?? onlyDigits(cnpj),
        teacherName: user?.name,
      })

      // Creating a gym promotes the user to teacher for this session.
      if (user) setUser({ ...user, role: 'teacher' })
      navigate('/home', { replace: true })
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível criar a academia.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col">
      <Header title="Nova academia" backTo="/home" />

      <FormLayout
        aside={
          <Card className="flex flex-col gap-4">
            <p className="font-display text-sm font-bold uppercase tracking-tight text-content">
              Ao criar você poderá
            </p>
            {PERKS.map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <Icon size={18} />
                </span>
                <p className="text-sm text-content">{text}</p>
              </div>
            ))}
          </Card>
        }
      >
        <header>
          <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight text-content">
            Cadastrar nova academia
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            Você se tornará o professor responsável.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Card className="flex flex-col gap-5">
            <Input
              name="name"
              label="Nome da academia"
              placeholder="Ex: Academia Central Krav Maga"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              name="cnpj"
              label="CNPJ"
              placeholder="00.000.000/0000-00"
              inputMode="numeric"
              required
              value={cnpj}
              onChange={(e) => setCnpj(maskCnpj(e.target.value))}
            />
            <InfoNote>
              Você se torna automaticamente o <strong>PROFESSOR</strong>{' '}
              responsável.
            </InfoNote>
          </Card>

          {error && <FormError>{error}</FormError>}

          <Button type="submit" loading={loading}>
            Criar academia
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/home')}
          >
            Cancelar
          </Button>
        </form>
      </FormLayout>
    </div>
  )
}
