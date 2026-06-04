import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'

interface HeaderProps {
  title: string
  /** Optional supporting line shown under the title on desktop for context. */
  subtitle?: string
  /** Show a back chevron on the left. Defaults to true. */
  back?: boolean
  /** Where the back button navigates. Defaults to -1 (history back). */
  backTo?: string
  /** Optional element rendered on the right (avatar, badge, icon button). */
  right?: ReactNode
  /** Optional count badge shown next to the title (e.g. pending count). */
  badge?: number
}

function CountBadge({ value }: { value: number }) {
  return (
    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-white">
      {value}
    </span>
  )
}

/**
 * Screen header.
 * - Phone (`< lg`): a dark sticky bar. Sub-pages show a back chevron on the
 *   left; top-level pages show the emblem tile as a brand anchor. Title centred.
 * - Desktop (`lg+`): a proper anchored page header — sticky, with a subtle
 *   bottom rule, a left-aligned title (plus optional subtitle and a "Voltar"
 *   link), and a right-hand actions slot — so it reads as a real web app
 *   instead of a title floating in empty space.
 */
export function Header({
  title,
  subtitle,
  back = true,
  backTo,
  right,
  badge,
}: HeaderProps) {
  const navigate = useNavigate()
  const goBack = () => (backTo ? navigate(backTo) : navigate(-1))

  return (
    <>
      {/* Phone: dark sticky bar */}
      <header className="pt-safe sticky top-0 z-40 flex h-14 items-center border-b border-white/5 bg-ink px-3 text-white lg:hidden">
        <div className="flex min-w-10 items-center">
          {back ? (
            <button
              type="button"
              aria-label="Voltar"
              onClick={goBack}
              className="-ml-1 flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-white/10 active:bg-white/15"
            >
              <ChevronLeft size={24} />
            </button>
          ) : (
            <Logo size={32} rounded="rounded-xl" />
          )}
        </div>

        <div className="flex flex-1 items-center justify-center gap-2">
          <h1 className="font-display text-base font-bold uppercase tracking-tight">
            {title}
          </h1>
          {badge ? <CountBadge value={badge} /> : null}
        </div>

        <div className="flex min-w-10 items-center justify-end">{right}</div>
      </header>

      {/* Desktop: anchored page header */}
      <header className="sticky top-0 z-30 mb-1 hidden items-end justify-between gap-4 border-b border-line bg-canvas/85 pb-5 pt-8 backdrop-blur lg:flex">
        <div className="min-w-0">
          {back && (
            <button
              type="button"
              onClick={goBack}
              className="-ml-2 mb-1.5 inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm font-medium text-muted transition-colors hover:bg-content/5 hover:text-content"
            >
              <ChevronLeft size={16} />
              Voltar
            </button>
          )}
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl font-bold tracking-tight text-content">
              {title}
            </h1>
            {badge ? <CountBadge value={badge} /> : null}
          </div>
          {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
        </div>

        <div className="flex shrink-0 items-center gap-2">{right}</div>
      </header>
    </>
  )
}
