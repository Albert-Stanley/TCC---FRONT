import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'

/**
 * Responsive app shell.
 *
 * - Phone / tablet (`< lg`): the app fills the screen edge-to-edge with the
 *   bottom navigation — a true mobile experience that stays perfectly
 *   responsive when narrowed down to phone widths.
 * - Desktop (`lg+`): a persistent left sidebar appears and the content is laid
 *   out in a roomy centred column, so it reads as a normal web app instead of a
 *   stretched phone screen.
 */
export function AppLayout({ children }: { children: ReactNode }) {
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
