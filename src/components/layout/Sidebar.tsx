import { NavLink, useLocation } from 'react-router-dom'
import {
  Home,
  Building2,
  Link2,
  Users,
  User,
  ShoppingBag,
  type LucideIcon,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { Brand } from '@/components/ui/Brand'
import { Avatar } from '@/components/ui/Avatar'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { NotificationsMenu } from '@/components/ui/NotificationsMenu'
import { CartButton } from '@/components/shop/CartButton'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

/**
 * Desktop-only left navigation (hidden below `lg`). Mirrors the mobile bottom
 * nav's role-based items but as a persistent web sidebar, so the app reads as a
 * normal desktop product on wide screens.
 */
export function Sidebar() {
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const role = user?.role

  // No sidebar on the auth screens.
  if (location.pathname === '/login' || location.pathname === '/register') {
    return null
  }

  const items: NavItem[] =
    role === 'teacher'
      ? [
          { to: '/home', label: 'Início', icon: Home },
          { to: '/students', label: 'Academia', icon: Building2 },
          { to: '/invites', label: 'Convites', icon: Link2 },
          { to: '/requests', label: 'Solicitações', icon: Users },
          { to: '/store', label: 'Loja', icon: ShoppingBag },
          { to: '/profile', label: 'Perfil', icon: User },
        ]
      : [
          { to: '/home', label: 'Início', icon: Home },
          { to: '/gyms', label: 'Academias', icon: Building2 },
          { to: '/invite', label: 'Convites', icon: Link2 },
          { to: '/store', label: 'Loja', icon: ShoppingBag },
          { to: '/profile', label: 'Perfil', icon: User },
        ]

  return (
    <aside className="sticky top-0 hidden h-[100dvh] w-80 shrink-0 flex-col overflow-hidden border-r border-line bg-surface px-4 py-6 lg:flex">
      <div className="flex items-center justify-between gap-1 px-2">
        <Brand
          size={30}
          className="min-w-0"
          wordmarkClassName="min-w-0 truncate text-base text-content"
        />
        <div className="flex shrink-0 items-center">
          <CartButton className="text-muted hover:bg-canvas hover:text-content" />
          <NotificationsMenu className="text-muted hover:bg-canvas hover:text-content" />
        </div>
      </div>

      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-primary-soft text-primary'
                  : 'text-muted hover:bg-canvas hover:text-content'
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="flex flex-col gap-3 border-t border-line pt-4">
        <ThemeToggle variant="bar" />
        <NavLink
          to="/profile"
          className="flex items-center gap-3 rounded-2xl px-2 py-2 transition-colors hover:bg-canvas"
        >
          <Avatar
            name={user?.name ?? user?.email}
            accent={role === 'teacher'}
            size="h-9 w-9 text-sm"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-content">
              {user?.name ?? 'Atleta'}
            </p>
            <p className="truncate text-xs text-muted">
              {role === 'teacher' ? 'Professor' : 'Aluno'}
            </p>
          </div>
        </NavLink>
      </div>
    </aside>
  )
}
