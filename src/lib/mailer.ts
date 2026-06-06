import type { Order } from '@/lib/shop'
import { formatBRL } from '@/lib/format'

export interface MailResult {
  ok: boolean
  /** Address the confirmation was sent to. */
  to: string
}

/**
 * Email seam — the single place that "sends" transactional email.
 *
 * MOCK today (there is no email backend): it renders the message and logs a
 * preview, then resolves. To go live, swap the body for one provider:
 *   - Backend/serverless (RECOMMENDED): `await api.post('/Shop/Orders/Notify', { orderId: order.id })`
 *       — the server holds the API key and sends the mail. No secret in the client.
 *   - Resend:  `await fetch('https://api.resend.com/emails', { method:'POST', headers:{ Authorization:`Bearer ${KEY}` }, body: JSON.stringify({ from, to, subject, html }) })`
 *   - EmailJS: `emailjs.send(SERVICE_ID, TEMPLATE_ID, params, PUBLIC_KEY)`
 *
 * ⚠️ Never embed a provider secret in the frontend bundle — prefer the
 * backend/serverless route. Keep this function's signature stable so the
 * checkout flow doesn't change when the provider does.
 */
export async function sendOrderConfirmation(order: Order): Promise<MailResult> {
  const subject = `Pedido ${order.id} confirmado — KravConnect`
  const body = renderOrderEmail(order)

  // MOCK delivery: simulate latency and "send".
  await new Promise((r) => setTimeout(r, 300))
  // Intentional: surfaces the simulated email while there is no provider.
  console.info(`[mailer] → ${order.email}\nAssunto: ${subject}\n\n${body}`)

  return { ok: true, to: order.email }
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
