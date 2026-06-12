import { api } from '@/lib/api'
import { useGymStore } from '@/store/gymStore'
import type { GymLink, Role, User } from '@/types'

/** Shape of GET /Users/Me on the backend (PerfilUsuarioDTO). */
interface MeResponse {
  id?: string
  name?: string
  email?: string
  cpf?: string
  cep?: string
  role?: string
  faixa?: string
  academias?: {
    id?: string
    nome?: string
    cnpj?: string
    vinculo?: string
    faixa?: string
  }[]
}

/** The gym the user teaches at (or assists as instructor), if any. */
export function teachingGym(user: User | null): GymLink | undefined {
  return user?.academias?.find(
    (a) => a.vinculo === 'professor' || a.vinculo === 'instrutor',
  )
}

/** The gym the user trains at as a student, if any. */
export function enrolledGym(user: User | null): GymLink | undefined {
  return user?.academias?.find((a) => a.vinculo === 'aluno')
}

/**
 * Fetches the authenticated user's profile + role from GET /Users/Me.
 * The login endpoint only returns a bare token, so the role (teacher/student)
 * and profile fields are resolved here right after a session is established.
 * Also reconciles the cached gym (name/CNPJ) for teachers, preserving the
 * locally-known coordinates/address when it's the same gym.
 */
export async function fetchProfile(): Promise<User> {
  const { data } = await api.get<MeResponse>('/Users/Me')
  const role: Role = data.role === 'teacher' ? 'teacher' : 'student'

  // O backend pode devolver a mesma academia mais de uma vez (vínculos
  // duplicados), o que duplicava os cards de academia e o seletor da loja.
  // Deduplica por id, mantendo o vínculo de maior privilégio.
  const VINCULO_RANK: Record<string, number> = { professor: 3, instrutor: 2, aluno: 1 }
  const byId = new Map<string, GymLink>()
  for (const a of data.academias ?? []) {
    const link: GymLink = {
      id: a.id ?? '',
      nome: a.nome ?? '',
      cnpj: a.cnpj ?? '',
      vinculo:
        a.vinculo === 'professor' || a.vinculo === 'instrutor'
          ? a.vinculo
          : 'aluno',
      faixa: a.faixa || undefined,
    }
    const existing = byId.get(link.id)
    if (!existing || VINCULO_RANK[link.vinculo] > VINCULO_RANK[existing.vinculo]) {
      byId.set(link.id, { ...existing, ...link })
    }
  }
  const academias: GymLink[] = [...byId.values()]

  const user: User = {
    id: data.id ?? '',
    name: data.name,
    email: data.email ?? '',
    cpf: data.cpf,
    cep: data.cep || undefined,
    role,
    faixa: data.faixa,
    academias,
  }

  // Keep the teacher's gym card in sync after a fresh login on another device:
  // the backend is the source of truth for name/CNPJ; coords/address are only
  // known locally (entered at creation), so they are kept when it's the same gym.
  const owned = teachingGym(user)
  if (owned) {
    const { gym, setGym } = useGymStore.getState()
    const same = gym && gym.cnpj === owned.cnpj
    setGym({
      ...(same ? gym : {}),
      id: owned.id,
      name: owned.nome,
      cnpj: owned.cnpj,
      teacherName: user.name,
    })
  }

  return user
}
