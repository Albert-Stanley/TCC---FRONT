/** Strips everything that isn't a digit. */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '')
}

/** Masks a CPF as 000.000.000-00 while typing. */
export function maskCpf(value: string): string {
  return onlyDigits(value)
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

/** Masks a CEP as 00000-000 while typing. */
export function maskCep(value: string): string {
  return onlyDigits(value)
    .slice(0, 8)
    .replace(/(\d{5})(\d)/, '$1-$2')
}

/** Masks a CNPJ as 00.000.000/0000-00 while typing. */
export function maskCnpj(value: string): string {
  return onlyDigits(value)
    .slice(0, 14)
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

/**
 * Extracts the invite token from a pasted value, accepting either a raw token
 * or a full link such as `localhost:3000/invite?=<token>` or `.../invite/<token>`.
 */
export function extractInviteToken(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  // Prefer the segment after the last `=` or `/` (covers both link shapes).
  const afterEquals = trimmed.split('=').pop() ?? trimmed
  const afterSlash = afterEquals.split('/').pop() ?? afterEquals
  return afterSlash.trim()
}

/** Formats an integer amount of cents as Brazilian currency (R$ 1.234,56). */
export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

/** Formats an ISO date (or date string) as DD/MM/YYYY; returns '' if invalid. */
export function formatDate(value?: string): string {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('pt-BR')
}

/** Formats an ISO date (or date string) as HH:MM; returns '' if invalid. */
export function formatTime(value?: string): string {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}
