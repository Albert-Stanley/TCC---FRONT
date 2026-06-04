import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ExternalLink, CheckCircle2, CalendarClock } from 'lucide-react'
import { api, getErrorMessage } from '@/lib/api'
import { Header } from '@/components/layout/Header'
import { FormLayout } from '@/components/layout/FormLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { InfoNote } from '@/components/ui/InfoNote'
import { FormError } from '@/components/ui/FormError'
import { SectionTitle } from '@/components/ui/SectionTitle'
import { DEMO_BILLING, nextDueDate } from '@/lib/demo'
import { formatBRL } from '@/lib/format'

/** Shape we try to read from the Abacate Pay response (best-effort). */
interface PaymentResponse {
  url?: string
  paymentUrl?: string
  checkoutUrl?: string
  brCode?: string
  amount?: number
}

export function Payment() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<PaymentResponse | null>(null)

  const due = nextDueDate(DEMO_BILLING.dueDay)

  async function handlePay() {
    setError(null)
    setLoading(true)
    try {
      const { data } = await api.post<PaymentResponse>('/Student/Payment')
      setResult(data ?? {})
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível iniciar o pagamento.'))
    } finally {
      setLoading(false)
    }
  }

  const checkoutUrl = result?.url ?? result?.paymentUrl ?? result?.checkoutUrl
  const paidAmount = result?.amount ?? DEMO_BILLING.amountCents

  if (result) {
    return (
      <div className="flex flex-col">
        <Header title="Mensalidade" />
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center px-6 py-12 text-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={38} />
          </span>
          <h1 className="mt-5 font-display text-2xl font-extrabold uppercase tracking-tight text-content">
            Pagamento iniciado!
          </h1>
          <p className="mt-2 text-sm text-muted">
            {checkoutUrl
              ? `Conclua o pagamento de ${formatBRL(paidAmount)} na página segura da Abacate Pay.`
              : 'Seu pagamento foi registrado. Acompanhe o status na sua academia.'}
          </p>
          <div className="mt-8 flex w-full flex-col gap-3">
            {checkoutUrl && (
              <a
                href={checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold uppercase tracking-wide text-white shadow-primary transition-all hover:bg-primary-dark active:scale-[0.98]"
              >
                <ExternalLink size={18} />
                Abrir pagamento
              </a>
            )}
            <Button variant="secondary" onClick={() => navigate('/gyms')}>
              Voltar
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <Header title="Mensalidade" />

      <FormLayout
        aside={
          <Card className="flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-muted">
                  Valor a pagar
                </p>
                <p className="mt-1 font-display text-3xl font-extrabold text-content">
                  {formatBRL(DEMO_BILLING.amountCents)}
                </p>
              </div>
              <Badge tone="soft">Em aberto</Badge>
            </div>

            <div className="space-y-2 border-t border-line pt-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted">Plano</span>
                <span className="font-semibold text-content">
                  {DEMO_BILLING.plan}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Forma de pagamento</span>
                <span className="font-semibold text-content">
                  {DEMO_BILLING.method}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Vencimento</span>
                <span className="flex items-center gap-1.5 font-semibold text-content">
                  <CalendarClock size={15} className="text-primary" />
                  {due}
                </span>
              </div>
            </div>
          </Card>
        }
      >
        <SectionTitle underline>Pagar mensalidade</SectionTitle>

        <InfoNote>
          Você será redirecionado para o ambiente seguro da Abacate Pay para
          concluir o pagamento.
        </InfoNote>

        {error && <FormError>{error}</FormError>}

        <Button loading={loading} onClick={handlePay}>
          Pagar {formatBRL(DEMO_BILLING.amountCents)}
        </Button>
        <Button variant="secondary" onClick={() => navigate('/gyms')}>
          Cancelar
        </Button>
      </FormLayout>
    </div>
  )
}
