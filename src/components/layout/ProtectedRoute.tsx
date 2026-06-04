import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { PREVIEW_MODE } from '@/lib/preview'
import type { Role } from '@/types'

interface ProtectedRouteProps {
  /** If provided, only these roles may access the nested routes. */
  allow?: Role[]
}

/**
 * Guards nested routes. Redirects unauthenticated users to /login and
 * users without an allowed role to /home (RBAC enforcement point).
 */
export function ProtectedRoute({ allow }: ProtectedRouteProps) {
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)

  if (PREVIEW_MODE) return <Outlet />

  if (!token) return <Navigate to="/login" replace />
  if (allow && user && !allow.includes(user.role)) {
    return <Navigate to="/home" replace />
  }
  return <Outlet />
}
