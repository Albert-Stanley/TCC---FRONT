/**
 * Demo content for screens whose data has no endpoint in the authoritative API
 * map yet (billing details, class schedule, a student's enrolled gym). Kept in
 * one place so it's obvious what is illustrative and easy to remove once the
 * backend exposes these. Render behind `PREVIEW_MODE` where it would otherwise
 * fake real account data.
 */

export const DEMO_BILLING = {
  amountCents: 14990,
  plan: 'Plano Mensal',
  method: 'Abacate Pay',
  dueDay: 10,
}

export const DEMO_CLASS = {
  modality: 'Krav Maga — Fundamentos',
  time: '19:00 – 20:00',
  instructor: 'Prof. Marcelo Silva',
  location: 'Tatame 1',
}

export const DEMO_GYM = {
  name: 'Krav Maga Santista',
  modality: 'Krav Maga · Defesa Pessoal',
  belt: 'Faixa Azul',
  plan: 'Plano Mensal',
  attendanceMonth: 11,
  nextClass: 'Hoje, 19:00',
  paymentStatus: 'paid' as const,
  // Address + coordinates power the map + "como chegar" directions. Santos/SP.
  address: 'Av. Affonso Penna, 511 — sala 21, Estuário',
  city: 'Santos · SP',
  cep: '11020-001',
  lat: -23.969748,
  lng: -46.304044,
}

/** Next monthly due date for `dueDay`, as a localized DD/MM/YYYY string. */
export function nextDueDate(dueDay: number): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(today.getFullYear(), today.getMonth(), dueDay)
  if (due < today) due.setMonth(due.getMonth() + 1)
  return due.toLocaleDateString('pt-BR')
}
