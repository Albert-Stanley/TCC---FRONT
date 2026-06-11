import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'

/** Auth screens own the whole viewport (split-screen layouts, no sidebar). */
const FULL_BLEED_ROUTES = ['/login', '/register', '/forgot-password']

/**
 * Responsive app shell.
 *
 * - Phone / tablet (`< lg`): the app fills the screen edge-to-edge with the
 *   bottom navigation — a true mobile experience that stays perfectly
 *   responsive when narrowed down to phone widths.
 * - Desktop (`lg+`): a persistent left sidebar appears and the content is laid
 *   out in a roomy centred column, so it reads as a normal web app instead of a
 *   stretched phone screen. Auth screens skip the column and go full-bleed.
 */
export function AppLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const fullBleed = FULL_BLEED_ROUTES.includes(pathname)

  if (fullBleed) {
    return (
      <div className="flex min-h-[100dvh] w-full flex-col bg-canvas text-content">
        {children}
      </div>
    )
  }

  return (
    <div className="flex min-h-[100dvh] w-full bg-canvas text-content">
      <Sidebar />
      <main className="flex min-h-[100dvh] w-full flex-1 flex-col lg:px-8">
        <div className="mx-auto flex w-full flex-1 flex-col lg:max-w-4xl">
          {children}
        </div>
      </main>
    </div>
  )
}
