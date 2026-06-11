import { api } from '@/lib/api'
import type { Role, User } from '@/types'

/** Shape of GET /Users/Me on the backend. */
interface MeResponse {
  id?: string
  name?: string
  email?: string
  cpf?: string
  role?: string
  faixa?: string
}

/**
 * Fetches the authenticated user's profile + role from GET /Users/Me.
 * The login endpoint only returns a bare token, so the role (teacher/student)
 * and profile fields are resolved here right after a session is established.
 */
export async function fetchProfile(): Promise<User> {
  const { data } = await api.get<MeResponse>('/Users/Me')
  const role: Role = data.role === 'teacher' ? 'teacher' : 'student'
  return {
    id: data.id ?? '',
    name: data.name,
    email: data.email ?? '',
    cpf: data.cpf,
    role,
    faixa: data.faixa,
  }
}
