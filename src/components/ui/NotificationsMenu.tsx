import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bell, BellRing } from 'lucide-react'
import { useNotificationStore } from '@/store/notificationStore'

/**
 * Bell button + popover notification feed. The panel is portalled to `body` and
 * fixed-positioned from the button rect, so it never gets clipped by the
 * `overflow-hidden` heroes it usually lives in. Reads from `notificationStore`,
 * so the unread dot reflects real pending items.
 */
export function NotificationsMenu({ className = '' }: { className?: string }) {
  const items = useNotificationStore((s) => s.items)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)

  // Close whenever the route changes (e.g. tapping a notification or a nav link).
  useEffect(() => setOpen(false), [pathname])
  const btnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(
    null,
  )

  useLayoutEffect(() => {
    if (!open) return

    const place = () => {
      const el = btnRef.current
      // The bell moves between the sidebar (lg+) and the mobile top bar across
      // the `lg` breakpoint. If this instance's button is gone/hidden, close so
      // the panel never floats orphaned in the old spot.
      if (!el) return setOpen(false)
      const r = el.getBoundingClientRect()
      if (r.width === 0 && r.height === 0) return setOpen(false)

      const width = Math.min(320, window.innerWidth - 24)
      // Align the panel's right edge with the button, then clamp into the
      // viewport so it never spills off-screen.
      const left = Math.max(
        12,
        Math.min(r.right - width, window.innerWidth - width - 12),
      )
      setPos({ top: r.bottom + 8, left, width })
    }

    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true) // capture: also any scroll container
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (panelRef.current?.contains(t) || btnRef.current?.contains(t)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const count = items.length
  const Icon = count > 0 ? BellRing : Bell

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label={count ? `Notificações (${count} novas)` : 'Notificações'}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`relative flex h-10 w-10 items-center justify-center rounded-full transition-colors ${className}`}
      >
        <Icon size={21} aria-hidden="true" />
        {count > 0 && (
          <span className="absolute right-2 top-2 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
        )}
      </button>

      {open &&
        pos &&
        createPortal(
          <div
            ref={panelRef}
            role="menu"
            aria-label="Notificações"
            style={{ top: pos.top, left: pos.left, width: pos.width }}
            className="fixed z-[60] origin-top animate-slide-up overflow-hidden rounded-3xl border border-line bg-surface text-content shadow-card"
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <p className="font-display text-sm font-bold uppercase tracking-tight">
                Notificações
              </p>
              {count > 0 && (
                <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
                  {count}
                </span>
              )}
            </div>

            {count === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted">
                Você está em dia. Nenhuma notificação.
              </p>
            ) : (
              <ul className="max-h-[60vh] overflow-y-auto">
                {items.map((n) => (
                  <li key={n.id}>
                    <button
                      role="menuitem"
                      onClick={() => {
                        setOpen(false)
                        if (n.to) navigate(n.to)
                      }}
                      className="flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-canvas"
                    >
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-content">
                          {n.title}
                        </span>
                        {n.description && (
                          <span className="block truncate text-xs text-muted">
                            {n.description}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>,
          document.body,
        )}
    </>
  )
}
