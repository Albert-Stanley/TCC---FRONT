import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { PREVIEW_USER } from '@/lib/preview'
import type { InviteRequest, Student } from '@/types'

/**
 * In-memory mock backend used while PREVIEW_MODE is on. It is installed as the
 * Axios adapter (see `src/lib/api.ts`), so every `api.*` call resolves against
 * this data instead of the network — the whole app is explorable with realistic
 * content and no server. Remove/disable by turning off PREVIEW_MODE.
 */

const delay = (ms = 450) => new Promise((r) => setTimeout(r, ms))

/** ISO string for `n` days ago (keeps "Solicitado em" dates looking fresh). */
const daysAgo = (n: number) =>
  new Date(Date.now() - n * 86_400_000).toISOString()

// --- Mock datasets -------------------------------------------------------

const STUDENTS: Student[] = [
  { id_aluno: 1, name: 'Ana Beatriz Souza', email: 'ana.souza@email.com', cpf: '12345678901', cep: '11075000', phone: '(13) 99123-4567', belt: 'Faixa Azul', status: 'active', paymentStatus: 'paid', plan: 'Mensal', joinedAt: daysAgo(420), lastPresence: daysAgo(1), attendanceMonth: 11 },
  { id_aluno: 2, name: 'Carlos Henrique Lima', email: 'carlos.lima@email.com', cpf: '23456789012', cep: '11013001', phone: '(13) 99234-5678', belt: 'Faixa Amarela', status: 'active', paymentStatus: 'paid', plan: 'Trimestral', joinedAt: daysAgo(180), lastPresence: daysAgo(2), attendanceMonth: 8 },
  { id_aluno: 3, name: 'Mariana Oliveira', email: 'mariana.oliveira@email.com', cpf: '34567890123', cep: '11025002', phone: '(13) 99345-6789', belt: 'Faixa Laranja', status: 'late', paymentStatus: 'late', plan: 'Mensal', joinedAt: daysAgo(95), lastPresence: daysAgo(12), attendanceMonth: 3 },
  { id_aluno: 4, name: 'Pedro Santos', email: 'pedro.santos@email.com', cpf: '45678901234', cep: '11040003', phone: '(13) 99456-7890', belt: 'Faixa Branca', status: 'active', paymentStatus: 'pending', plan: 'Mensal', joinedAt: daysAgo(38), lastPresence: daysAgo(3), attendanceMonth: 6 },
  { id_aluno: 5, name: 'Juliana Costa', email: 'juliana.costa@email.com', cpf: '56789012345', cep: '11055004', phone: '(13) 99567-8901', belt: 'Faixa Verde', status: 'active', paymentStatus: 'paid', plan: 'Anual', joinedAt: daysAgo(610), lastPresence: daysAgo(1), attendanceMonth: 14 },
  { id_aluno: 6, name: 'Felipe Rodrigues', email: 'felipe.rodrigues@email.com', cpf: '67890123456', cep: '11065005', phone: '(13) 99678-9012', belt: 'Faixa Branca', status: 'inactive', paymentStatus: 'late', plan: 'Mensal', joinedAt: daysAgo(250), lastPresence: daysAgo(45), attendanceMonth: 0 },
]

const REQUESTS: InviteRequest[] = [
  { id_aluno: 11, name: 'Rafael Almeida', cpf: '78901234567', cep: '11075000', requestedAt: daysAgo(0), status: 'pending' },
  { id_aluno: 12, name: 'Beatriz Fernandes', cpf: '89012345678', cep: '11013001', requestedAt: daysAgo(1), status: 'pending' },
  { id_aluno: 13, name: 'Lucas Pereira', cpf: '90123456789', cep: '11025002', requestedAt: daysAgo(2), status: 'pending' },
  { id_aluno: 14, name: 'Camila Ribeiro', cpf: '01234567890', cep: '11040003', requestedAt: daysAgo(4), status: 'approved' },
]

// --- Adapter -------------------------------------------------------------

function ok(config: InternalAxiosRequestConfig, data: unknown, status = 200): AxiosResponse {
  return {
    data,
    status,
    statusText: status >= 200 && status < 300 ? 'OK' : 'Error',
    headers: {},
    config,
  }
}

function fail(config: InternalAxiosRequestConfig, message: string, status = 400): never {
  throw new AxiosError(
    message,
    'ERR_BAD_REQUEST',
    config,
    null,
    ok(config, { message }, status),
  )
}

export async function mockAdapter(
  config: InternalAxiosRequestConfig,
): Promise<AxiosResponse> {
  await delay()
  const method = (config.method ?? 'get').toLowerCase()
  const url = (config.url ?? '').split('?')[0]
  const R = (data: unknown, status = 200) => ok(config, data, status)

  // --- Auth & account ---
  if (url === '/Auth' && method === 'post')
    return R({ token: 'preview-token', user: PREVIEW_USER })
  if (url === '/users/registration' && method === 'post')
    return R({ token: 'preview-token', user: PREVIEW_USER })
  if (url === '/users/update' && method === 'put') {
    const body = parse(config.data)
    return R({ user: { ...PREVIEW_USER, ...body } })
  }

  // --- Gym (teacher) ---
  if (url === '/Gym/Create' && method === 'post') {
    const body = parse(config.data)
    return R({ id: Math.floor(Math.random() * 1000) + 1, name: body.name, cnpj: body.cnpj })
  }
  if (url === '/Gym/Invite/Generate' && method === 'post') {
    const token = crypto.randomUUID()
    return R({
      token,
      url: `${origin()}/invite?=${token}`,
      expiration: daysAgo(-7), // expires in 7 days
    })
  }
  if (url === '/Gym/Invite/Requests' && method === 'get') return R(REQUESTS)
  if (url === '/Gym/Invite/Approvation' && method === 'post') return R({ ok: true })
  if (url.startsWith('/Gym/Invite/Join/') && method === 'post') {
    const token = decodeURIComponent(url.split('/').pop() ?? '')
    // Demonstrate the invalid-token path: any token containing "inval".
    if (!token || token.toLowerCase().includes('inval'))
      return fail(config, 'Convite inválido ou expirado.')
    return R({ ok: true })
  }
  if (url === '/Gym/Students/Select' && method === 'get') return R(STUDENTS)
  if (url === '/Gym/Students/Remove' && method === 'post') return R({ ok: true })
  if (url.startsWith('/Gym/Classes/') && method === 'post')
    return R({ id: Math.floor(Math.random() * 1000) + 1, ok: true })

  // --- Student ---
  if (url === '/Student/Presence' && method === 'post')
    return R({ ok: true, registeredAt: new Date().toISOString() })
  if (url === '/Student/Payment' && method === 'post')
    return R({
      url: 'https://pay.abacatepay.com/checkout/demo-kravconnect',
      amount: 14990,
    })

  // Unmatched route — succeed quietly so nothing breaks while previewing.
  return R({})
}

function parse(data: unknown): Record<string, unknown> {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data)
    } catch {
      return {}
    }
  }
  return (data as Record<string, unknown>) ?? {}
}

function origin(): string {
  return typeof window !== 'undefined'
    ? window.location.origin
    : 'http://localhost:5173'
}
