import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle2,
  CalendarClock,
  Download,
  Receipt,
} from 'lucide-react'
import { api, getErrorMessage } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { Header } from '@/components/layout/Header'
import { FormLayout } from '@/components/layout/FormLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { InfoNote } from '@/components/ui/InfoNote'
import { FormError } from '@/components/ui/FormError'
import { SectionTitle } from '@/components/ui/SectionTitle'
import {
  DEMO_BILLING,
  DEMO_GYM,
  DEMO_PAYMENTS,
  nextDueDate,
  type DemoPayment,
} from '@/lib/demo'
import { formatBRL, formatDate } from '@/lib/format'

/** Response of POST /Student/Payment (Stripe PaymentIntent). */
interface PaymentResponse {
  id_pagamento?: string
  client_secret?: string
}

/** Builds and downloads a plain-text receipt for a paid invoice. */
function downloadReceipt(p: DemoPayment, gym: string, payer?: string) {
  const lines = [
    'COMPROVANTE DE PAGAMENTO',
    '========================',
    `Academia:   ${gym}`,
    payer ? `Aluno:      ${payer}` : '',
    `Referência: ${p.monthLabel}`,
    `Valor:      ${formatBRL(p.amountCents)}`,
    `Pago em:    ${formatDate(p.paidAt)}`,
    `Forma:      ${DEMO_BILLING.method}`,
    `Status:     PAGO`,
    '',
    'Documento gerado pelo KravConnect.',
  ].filter(Boolean)
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `comprovante-${p.id}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

export function Payment() {
  const navigate = useNavigate()
  const payerName = useAuthStore((s) => s.user?.name)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<PaymentResponse | null>(null)

  const due = nextDueDate(DEMO_BILLING.dueDay)

  async function handlePay() {
    setError(null)
    setLoading(true)
    try {
      // The backend creates a Stripe PaymentIntent for the given amount.
      const { data } = await api.post<PaymentResponse>('/Student/Payment', {
        valor_centavos: DEMO_BILLING.amountCents,
      })
      setResult(data ?? {})
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível iniciar o pagamento.'))
    } finally {
      setLoading(false)
    }
  }

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
            Seu pagamento de {formatBRL(DEMO_BILLING.amountCents)} foi iniciado
            na Stripe. Acompanhe o status na sua academia.
          </p>
          {result.id_pagamento && (
            <p className="mt-3 rounded-xl bg-canvas px-4 py-2 font-mono text-xs text-muted">
              Código: {result.id_pagamento}
            </p>
          )}
          <div className="mt-8 flex w-full flex-col gap-3">
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
          O pagamento é processado com segurança pela Stripe.
        </InfoNote>

        {error && <FormError>{error}</FormError>}

        <Button loading={loading} onClick={handlePay}>
          Pagar {formatBRL(DEMO_BILLING.amountCents)}
        </Button>

        {/* Payment history */}
        <section className="mt-2 flex flex-col gap-3">
          <SectionTitle>Histórico de pagamentos</SectionTitle>
          <div className="flex flex-col gap-2.5">
            {DEMO_PAYMENTS.map((p) => (
              <Card key={p.id} className="flex items-center gap-3 py-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <Receipt size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-content">
                    {p.monthLabel}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {formatBRL(p.amountCents)} · pago em {formatDate(p.paidAt)}
                  </p>
                </div>
                <Badge tone="success">Pago</Badge>
                <button
                  onClick={() => downloadReceipt(p, DEMO_GYM.name, payerName)}
                  aria-label={`Baixar comprovante de ${p.monthLabel}`}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-canvas hover:text-primary"
                >
                  <Download size={18} />
                </button>
              </Card>
            ))}
          </div>
        </section>
      </FormLayout>
    </div>
  )
}
