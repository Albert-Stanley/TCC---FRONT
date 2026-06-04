import { NavLink } from 'react-router-dom'
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
import { useCartCount } from '@/store/cartStore'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  /** Optional count badge (e.g. pending requests). */
  badge?: number
}

/**
 * Bottom navigation. The item set depends on the role: students get the gym
 * journey, teachers get the management tabs (matches the TCC mockups).
 */
export function BottomNav() {
  const role = useAuthStore((s) => s.user?.role)
  const cartCount = useCartCount()

  const items: NavItem[] =
    role === 'teacher'
      ? [
          { to: '/home', label: 'Início', icon: Home },
          { to: '/students', label: 'Academia', icon: Building2 },
          { to: '/invites', label: 'Convites', icon: Link2 },
          { to: '/requests', label: 'Solicitações', icon: Users },
          { to: '/store', label: 'Loja', icon: ShoppingBag, badge: cartCount || undefined },
          { to: '/profile', label: 'Perfil', icon: User },
        ]
      : [
          { to: '/home', label: 'Início', icon: Home },
          { to: '/gyms', label: 'Academias', icon: Building2 },
          { to: '/store', label: 'Loja', icon: ShoppingBag, badge: cartCount || undefined },
          { to: '/invite', label: 'Convites', icon: Link2 },
          { to: '/profile', label: 'Perfil', icon: User },
        ]

  return (
    <nav className="sticky bottom-0 z-50 mt-auto flex h-16 w-full items-stretch border-t border-line bg-surface/90 px-1.5 pb-[env(safe-area-inset-bottom)] shadow-nav backdrop-blur-lg lg:hidden">
      {items.map(({ to, label, icon: Icon, badge }) => (
        <NavLink
          key={to}
          to={to}
          className="relative flex flex-1 flex-col items-center justify-center gap-1 text-center"
        >
          {({ isActive }) => (
            <>
              <span
                className={`relative flex h-8 w-12 items-center justify-center rounded-full transition-all duration-200 ${
                  isActive ? 'bg-primary-soft text-primary' : 'text-muted'
                }`}
              >
                <Icon size={21} strokeWidth={isActive ? 2.4 : 2} />
                {badge ? (
                  <span className="absolute -right-0.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white ring-2 ring-surface">
                    {badge}
                  </span>
                ) : null}
              </span>
              <span
                className={`text-[9px] font-bold uppercase leading-none tracking-tight transition-colors ${
                  isActive ? 'text-primary' : 'text-muted'
                }`}
              >
                {label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
