import type { User } from '@/types'

/**
 * TEMPORARY preview mode. While `true`, auth/RBAC guards are bypassed and a
 * demo session is seeded so the entire app (student + teacher flows) can be
 * browsed without a backend. Flip to `false` to restore real authentication.
 */
export const PREVIEW_MODE = false

/** Demo user used to populate role-based UI while previewing. */
export const PREVIEW_USER: User = {
  id: 'preview',
  name: 'Marcelo Silva',
  email: 'marcelo@kravconnect.app',
  cpf: '12345678900',
  cep: '11075000',
  role: 'teacher',
}
