import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { ClipboardPaste, CheckCircle2, Link2, ShieldCheck, BadgeCheck } from 'lucide-react'
import { api, getErrorMessage } from '@/lib/api'
import { Header } from '@/components/layout/Header'
import { FormLayout } from '@/components/layout/FormLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { FormError } from '@/components/ui/FormError'
import { SectionTitle } from '@/components/ui/SectionTitle'
import { extractInviteToken } from '@/lib/format'

const STEPS = [
  { icon: Link2, title: 'Cole o convite', text: 'Use o link ou código que o professor enviou.' },
  { icon: ShieldCheck, title: 'Enviamos a solicitação', text: 'Seu pedido vai para o professor da academia.' },
  { icon: BadgeCheck, title: 'Aguarde a aprovação', text: 'Você é notificado assim que for aceito.' },
]

export function InsertInvite() {
  const navigate = useNavigate()
  const [raw, setRaw] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const token = extractInviteToken(raw)

  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText()
      if (text) setRaw(text)
    } catch {
      // Clipboard access denied — the user can paste manually.
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (!token) {
      setError('Cole o link ou código do convite.')
      return
    }

    setLoading(true)
    try {
      await api.post('/Gyms/Requests/Join', { convite_uuid: token })
      setSent(true)
    } catch (err) {
      // 400 means the token is invalid/expired per the API contract.
      if (axios.isAxiosError(err) && err.response?.status === 400) {
        setError('Convite inválido ou expirado. Confira o link e tente novamente.')
      } else {
        setError(getErrorMessage(err, 'Não foi possível enviar a solicitação.'))
      }
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col">
        <Header title="Entrar em academia" />
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center px-6 py-12 text-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary-soft text-primary">
            <CheckCircle2 size={38} />
          </span>
          <h1 className="mt-5 font-display text-2xl font-extrabold uppercase tracking-tight text-content">
            Solicitação enviada!
          </h1>
          <p className="mt-2 text-sm text-muted">
            O professor responsável precisará aprovar seu acesso. Você será
            notificado quando isso acontecer.
          </p>
          <div className="mt-8 w-full">
            <Button onClick={() => navigate('/home')}>Voltar ao início</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <Header title="Entrar em academia" />

      <FormLayout
        aside={
          <Card className="flex flex-col gap-4">
            <p className="font-display text-sm font-bold uppercase tracking-tight text-content">
              Como funciona
            </p>
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <Icon size={18} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-content">{title}</p>
                  <p className="text-xs text-muted">{text}</p>
                </div>
              </div>
            ))}
          </Card>
        }
      >
        <div>
          <SectionTitle underline>Inserir convite</SectionTitle>
          <p className="mt-3 text-sm text-muted">
            Cole o link ou código que recebeu do seu professor.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Card>
            <label
              htmlFor="invite"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted"
            >
              Link ou código
            </label>
            <div className="relative">
              <input
                id="invite"
                name="invite"
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                placeholder="Cole o link aqui..."
                className="h-13 w-full rounded-xl border border-line bg-surface px-4 pr-12 text-[15px] text-content shadow-soft transition-all placeholder:text-neutral-400 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
              />
              <button
                type="button"
                onClick={handlePaste}
                aria-label="Colar da área de transferência"
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-muted transition-colors hover:text-primary"
              >
                <ClipboardPaste size={20} />
              </button>
            </div>
          </Card>

          {error && <FormError>{error}</FormError>}

          <Button type="submit" loading={loading}>
            Enviar solicitação
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
