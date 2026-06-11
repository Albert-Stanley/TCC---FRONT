import { api, asList } from '@/lib/api'
import { useStudentsStore } from '@/store/studentsStore'
import { useRequestsStore } from '@/store/requestsStore'
import type { InviteRequest, Student } from '@/types'

/**
 * Roster orchestration: loads and mutates the teacher's join requests and
 * enrolled students through their shared stores, so every teacher screen
 * (dashboard, Solicitações, Alunos) reads the same, always-current data.
 *
 * Maps the backend DTOs (Portuguese field names) into the front types:
 *  - Join requests come from GET /Gyms/Requests/Join/List and are keyed by
 *    `id_solicitacao` (the approve endpoint needs that id, not the student id).
 *  - Students come from GET /Gyms/Students/List ({id_aluno, nome, cpf, faixa}).
 */

function mapRequest(r: Record<string, unknown>): InviteRequest {
  return {
    id_aluno: String(r.id_solicitacao ?? ''),
    name: r.nome as string | undefined,
    cpf: r.cpf as string | undefined,
    cep: r.cep as string | undefined,
    status: 'pending',
  }
}

function mapStudent(s: Record<string, unknown>): Student {
  return {
    id_aluno: String(s.id_aluno ?? ''),
    name: s.nome as string | undefined,
    cpf: s.cpf as string | undefined,
    belt: s.faixa as string | undefined,
    status: 'active',
  }
}

/**
 * Loads join requests + enrolled students into their stores. Resolves each
 * resource independently so one failing endpoint doesn't blank the other;
 * rejects only if both fail (so the caller can show an error).
 */
export async function loadRoster(): Promise<void> {
  const [reqRes, stuRes] = await Promise.allSettled([
    api.get('/Gyms/Requests/Join/List'),
    api.get('/Gyms/Students/List'),
  ])

  if (reqRes.status === 'fulfilled') {
    useRequestsStore
      .getState()
      .setRequests(asList<Record<string, unknown>>(reqRes.value.data).map(mapRequest))
  }
  if (stuRes.status === 'fulfilled') {
    useStudentsStore
      .getState()
      .mergeStudents(asList<Record<string, unknown>>(stuRes.value.data).map(mapStudent))
  }
  if (reqRes.status === 'rejected' && stuRes.status === 'rejected') {
    throw reqRes.reason
  }
}

/** Refetches the enrolled students list and reconciles it into the store. */
async function refreshStudents(): Promise<void> {
  const { data } = await api.get('/Gyms/Students/List')
  useStudentsStore
    .getState()
    .mergeStudents(asList<Record<string, unknown>>(data).map(mapStudent))
}

/**
 * Approves a join request (POST /Gyms/Requests/Join/Approve) using its
 * `id_solicitacao`. Optimistically flags the request as approved, then refetches
 * the enrolled students from the server. Rolls back on failure and rethrows.
 */
export async function approveRequest(id: string | number): Promise<void> {
  const requests = useRequestsStore.getState()
  const req = requests.requests.find((r) => r.id_aluno === id)
  const prevStatus = req?.status ?? 'pending'

  requests.setStatus(id, 'approved')

  try {
    await api.post('/Gyms/Requests/Join/Approve', { id_solicitacao: id })
    await refreshStudents().catch(() => {})
  } catch (err) {
    requests.setStatus(id, prevStatus)
    throw err
  }
}
