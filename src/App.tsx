import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useGymStore } from '@/store/gymStore'
import { useInviteStore } from '@/store/inviteStore'
import { useThemeStore, applyTheme } from '@/store/themeStore'
import { PREVIEW_MODE, PREVIEW_USER } from '@/lib/preview'
import { AppLayout } from '@/components/layout/AppLayout'
import { NavLayout } from '@/components/layout/NavLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { Login } from '@/pages/Login'
import { Register } from '@/pages/Register'
import { Home } from '@/pages/Home'
import { Profile } from '@/pages/Profile'
import { MyGyms } from '@/pages/student/MyGyms'
import { InsertInvite } from '@/pages/student/InsertInvite'
import { Presence } from '@/pages/student/Presence'
import { Payment } from '@/pages/student/Payment'
import { CreateGym } from '@/pages/teacher/CreateGym'
import { Invites } from '@/pages/teacher/Invites'
import { Requests } from '@/pages/teacher/Requests'
import { Students } from '@/pages/teacher/Students'
import { Classes } from '@/pages/teacher/Classes'
import { Store } from '@/pages/shop/Store'
import { ProductDetail } from '@/pages/shop/ProductDetail'
import { Cart } from '@/pages/shop/Cart'
import { Checkout } from '@/pages/shop/Checkout'

export function App() {
  // Keep the <html> dark class in sync with the persisted theme.
  const theme = useThemeStore((s) => s.theme)
  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  // While previewing without a backend, seed a demo session so role-based
  // screens (student + teacher) render. No-op once real auth is restored.
  useEffect(() => {
    if (!PREVIEW_MODE) return
    const { user, setSession } = useAuthStore.getState()
    if (!user) setSession('preview-token', PREVIEW_USER)

    // Seed a sample gym + invites so the teacher dashboard isn't empty.
    if (!useGymStore.getState().gym) {
      useGymStore.getState().setGym({
        id: 1,
        name: 'Krav Maga Santista',
        cnpj: '12345678000190',
        teacherName: PREVIEW_USER.name,
      })
    }
    if (useInviteStore.getState().invites.length === 0) {
      const origin =
        typeof window !== 'undefined' ? window.location.origin : ''
      const mk = (token: string, status: 'active' | 'used') => ({
        id: token,
        token,
        url: `${origin}/invite?=${token}`,
        status,
        createdAt: new Date().toISOString(),
      })
      useInviteStore.setState({
        invites: [mk('a1b2c3d4-demo-ativo', 'active'), mk('e5f6g7h8-demo-usado', 'used')],
      })
    }
  }, [])

  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Authenticated (with bottom navigation) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<NavLayout />}>
              <Route path="/home" element={<Home />} />
              {/* Student journey */}
              <Route path="/gyms" element={<MyGyms />} />
              <Route path="/invite" element={<InsertInvite />} />
              <Route path="/presence" element={<Presence />} />
              <Route path="/payment" element={<Payment />} />
              {/* Shared */}
              <Route path="/store" element={<Store />} />
              <Route path="/profile" element={<Profile />} />
            </Route>

            {/* Teacher flow — role-gated (with bottom navigation) */}
            <Route element={<ProtectedRoute allow={['teacher']} />}>
              <Route element={<NavLayout />}>
                <Route path="/students" element={<Students />} />
                <Route path="/invites" element={<Invites />} />
                <Route path="/requests" element={<Requests />} />
              </Route>
              {/* Full-screen teacher flow (no bottom nav) */}
              <Route path="/classes" element={<Classes />} />
            </Route>

            {/* Shop — full-screen flow (no bottom nav), available to any user */}
            <Route path="/store/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />

            {/* Create gym — available to any authenticated user (promotes to teacher) */}
            <Route path="/gyms/new" element={<CreateGym />} />
          </Route>

          {/* Fallbacks */}
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  )
}
