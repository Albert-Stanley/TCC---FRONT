import type { Order } from '@/lib/shop'
import { api } from '@/lib/api'
import { formatBRL } from '@/lib/format'

export interface MailResult {
  ok: boolean
  /** Address the confirmation was sent to. */
  to: string
}

/**
 * Email seam — the single place that sends the order confirmation.
 *
 * Delegates to the backend (`POST /Gyms/Products/Email`, body `{ para, conteudo }`),
 * which holds the provider credentials — no secret ever lives in the client.
 * Best-effort: a delivery failure must not break the checkout, so it resolves
 * with `ok: false` instead of throwing.
 */
export async function sendOrderConfirmation(order: Order): Promise<MailResult> {
  const subject = `Pedido ${order.id} confirmado — KravConnect`
  const conteudo = `${subject}\n\n${renderOrderEmail(order)}`

  try {
    await api.post('/Gyms/Products/Email', { para: order.email, conteudo })
    return { ok: true, to: order.email }
  } catch {
    return { ok: false, to: order.email }
  }
}

/** Plain-text confirmation body (a real provider would use an HTML template). */
function renderOrderEmail(o: Order): string {
  const lines = o.items
    .map(
      (i) =>
        `- ${i.qty}× ${i.name}${i.size ? ` (${i.size})` : ''} — ${formatBRL(
          i.priceCents * i.qty,
        )}`,
    )
    .join('\n')
  return [
    `Olá, ${o.customerName}!`,
    '',
    `Recebemos o seu pedido ${o.id}. Confira o resumo:`,
    '',
    lines,
    '',
    `Subtotal: ${formatBRL(o.subtotalCents)}`,
    `Frete: ${o.shippingCents === 0 ? 'Grátis' : formatBRL(o.shippingCents)}`,
    `Total: ${formatBRL(o.totalCents)}`,
    '',
    `Entrega em: ${o.address}`,
    'Avisaremos quando o pedido for despachado. Obrigado por treinar com a gente!',
  ].join('\n')
}
