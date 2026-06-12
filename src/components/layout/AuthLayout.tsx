import type { ReactNode } from 'react'
import {
  MapPin,
  Users,
  GraduationCap,
  ShoppingBag,
} from 'lucide-react'
import { Brand } from '@/components/ui/Brand'
import { Logo } from '@/components/ui/Logo'
import { Wordmark } from '@/components/ui/Wordmark'

const FEATURES = [
  { icon: MapPin, text: 'Check-in por GPS direto do tatame' },
  { icon: GraduationCap, text: 'Aulas e graduações organizadas por faixa' },
  { icon: Users, text: 'Gestão completa de alunos para professores' },
  { icon: ShoppingBag, text: 'Loja de equipamentos da sua academia' },
]

interface AuthLayoutProps {
  /** Heading shown above the form. */
  title: string
  subtitle?: string
  /** The form itself. */
  children: ReactNode
  /** Bottom link, e.g. "Não tem conta? Cadastre-se". */
  footer?: ReactNode
}

/**
 * Shared shell for the auth screens (login / register / password reset).
 *
 * - Desktop: split-screen — a dark brand panel with the product pitch on the
 *   left, and the form in a narrow centred column (max-w-sm) on the right, so
 *   fields never stretch across the viewport.
 * - Mobile: compact dark hero with the brand, then the form in a rounded sheet.
 */
export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="flex min-h-[100dvh] flex-1 bg-surface">
      {/* ── Brand panel (desktop) ─────────────────────────────────────── */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-ink via-ink to-ink-soft p-12 text-white lg:flex lg:w-[46%] xl:p-16">
        <Brand size={34} wordmarkClassName="text-xl text-white" />

        <div className="max-w-md">
          <h1 className="font-display text-[2.6rem] font-extrabold uppercase leading-[1.08] tracking-tight">
            Sua academia de{' '}
            <span className="text-primary">Krav Maga</span> em um só lugar
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-white/55">
            Presença por GPS, aulas, graduações e mensalidade — para alunos e
            professores.
          </p>

          <ul className="mt-10 flex flex-col gap-3">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li
                key={text}
                className="flex items-center gap-3.5 rounded-2xl bg-white/[0.04] px-4 py-3 ring-1 ring-white/10"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Icon size={17} />
                </span>
                <span className="text-sm font-medium text-white/85">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-white/35">
          KravConnect · gestão de academias de Krav Maga
        </p>

        {/* Decorative glows */}
        <span className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-primary/25 blur-3xl" />
        <span className="pointer-events-none absolute -bottom-28 -left-28 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      </aside>

      {/* ── Form side ─────────────────────────────────────────────────── */}
      <div className="flex min-h-[100dvh] flex-1 flex-col">
        {/* Mobile brand header — centred lockup, legível em tema claro e escuro */}
        <div className="relative flex flex-col items-center overflow-hidden px-6 pb-4 pt-safe lg:hidden">
          <span className="pointer-events-none absolute -top-10 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
          <div className="relative flex flex-col items-center pt-12">
            <Logo size={60} rounded="rounded-2xl" className="shadow-card" />
            <Wordmark className="mt-3.5 text-2xl" />
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
              Krav Maga · Defesa Pessoal
            </p>
          </div>
        </div>

        {/* Form sheet */}
        <div className="flex flex-1 flex-col px-6 pb-10 pt-4 lg:items-center lg:justify-center lg:px-12 lg:py-12">
          <div className="mx-auto flex w-full max-w-sm flex-1 flex-col lg:mx-0 lg:flex-none">
            <header>
              <Logo
                size={52}
                rounded="rounded-2xl"
                className="mb-6 hidden shadow-card lg:block"
              />
              <h2 className="font-display text-[26px] font-extrabold uppercase tracking-tight text-content">
                {title}
              </h2>
              {subtitle && (
                <p className="mt-1.5 text-sm leading-relaxed text-muted">
                  {subtitle}
                </p>
              )}
            </header>

            <div className="mt-7">{children}</div>

            {footer && (
              <p className="mt-auto pt-9 text-center text-sm text-muted lg:mt-0">
                {footer}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
