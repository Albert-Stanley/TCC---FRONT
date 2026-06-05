import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Role, User } from '@/types'
import { decodeJwt } from '@/lib/jwt'
import { useGymStore } from '@/store/gymStore'
import { useInviteStore } from '@/store/inviteStore'
import { useClassStore } from '@/store/classStore'

/** Claims we attempt to read from the JWT to bootstrap the session. */
interface JwtClaims {
  id?: string | number
  sub?: string | number
  name?: string
  username?: string
  email?: string
  cpf?: string
  role?: Role
  roles?: Role[]
}

interface AuthState {
  token: string | null
  user: User | null
  /** Persist a session. If the server doesn't return a user, derive it from the JWT. */
  setSession: (token: string, user?: User | null) => void
  /** Replace just the user object (e.g. after a profile update). */
  setUser: (user: User) => void
  logout: () => void
  isAuthenticated: () => boolean
  hasRole: (...roles: Role[]) => boolean
}

function userFromToken(token: string): User | null {
  const claims = decodeJwt<JwtClaims>(token)
  if (!claims) return null
  return {
    id: claims.id ?? claims.sub ?? '',
    name: claims.name,
    username: claims.username,
    email: claims.email ?? '',
    cpf: claims.cpf,
    role: claims.role ?? claims.roles?.[0] ?? 'student',
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setSession: (token, user) =>
        set({ token, user: user ?? userFromToken(token) }),
      setUser: (user) => set({ user }),
      logout: () => {
        set({ token: null, user: null })
        // Clear cached teacher session data so the next account starts clean.
        useGymStore.getState().setGym(null)
        useInviteStore.setState({ invites: [] })
        useClassStore.setState({ classes: [] })
      },
      isAuthenticated: () => Boolean(get().token),
      hasRole: (...roles) => {
        const current = get().user?.role
        return current ? roles.includes(current) : false
      },
    }),
    {
      name: 'kravconnect-auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
    },
  ),
)
