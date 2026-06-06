import { api, asList } from '@/lib/api'
import { useStudentsStore } from '@/store/studentsStore'
import { useRequestsStore } from '@/store/requestsStore'
import type { InviteRequest, Student } from '@/types'

/**
 * Roster orchestration: loads and mutates the teacher's join requests and
 * enrolled students through their shared stores, so every teacher screen
 * (dashboard, Solicitações, Alunos) reads the same, always-current data.
 */

/**
 * Loads join requests + enrolled students into their stores. Resolves each
 * resource independently so one failing endpoint doesn't blank the other;
 * rejects only if both fail (so the caller can show an error).
 */
export async function loadRoster(): Promise<void> {
  const [reqRes, stuRes] = await Promise.allSettled([
    api.get('/Gym/Invite/Requests'),
    api.get('/Gym/Students/Select'),
  ])

  if (reqRes.status === 'fulfilled') {
    const list = asList<InviteRequest>(reqRes.value.data).map((r) => ({
      ...r,
      status: r.status ?? 'pending',
    }))
    useRequestsStore.getState().setRequests(list)
  }
  if (stuRes.status === 'fulfilled') {
    useStudentsStore.getState().mergeStudents(asList<Student>(stuRes.value.data))
  }
  if (reqRes.status === 'rejected' && stuRes.status === 'rejected') {
    throw reqRes.reason
  }
}

/** Refetches the enrolled students list and reconciles it into the store. */
async function refreshStudents(): Promise<void> {
  const { data } = await api.get('/Gym/Students/Select')
  useStudentsStore.getState().mergeStudents(asList<Student>(data))
}

/** Builds a provisional Student from a join request for optimistic enrollment. */
function requestToStudent(req: InviteRequest): Student {
  return {
    id_aluno: req.id_aluno,
    name: req.name,
    cpf: req.cpf,
    cep: req.cep,
    status: 'active',
    joinedAt: new Date().toISOString(),
  }
}

/**
 * Approves a student's join request (POST /Gym/Invite/Approvation).
 *
 * Optimistically marks the request as approved and enrolls the student so the
 * dashboard count updates instantly, then reconciles the enrolled list with the
 * server. On failure it rolls back both changes and rethrows, so the calling
 * screen can surface the error.
 */
export async function approveRequest(id: string | number): Promise<void> {
  const requests = useRequestsStore.getState()
  const students = useStudentsStore.getState()
  const req = requests.requests.find((r) => r.id_aluno === id)
  const prevStatus = req?.status ?? 'pending'

  // Optimistic update.
  requests.setStatus(id, 'approved')
  if (req) students.upsertStudent(requestToStudent(req))

  try {
    await api.post('/Gym/Invite/Approvation', { id_aluno: id })
    // Reconcile with server truth; keep the optimistic entry if it lags.
    await refreshStudents().catch(() => {})
  } catch (err) {
    // Roll back the optimistic changes.
    requests.setStatus(id, prevStatus)
    students.removeStudent(id)
    throw err
  }
}
