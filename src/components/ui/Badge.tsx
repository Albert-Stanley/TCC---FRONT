import type { ReactNode } from 'react'

type Tone = 'primary' | 'neutral' | 'ink' | 'soft' | 'success'

interface BadgeProps {
  children: ReactNode
  tone?: Tone
  className?: string
}

const tones: Record<Tone, string> = {
  primary: 'bg-primary text-white',
  neutral: 'bg-line text-muted',
  ink: 'bg-ink text-white',
  soft: 'bg-primary-soft text-primary',
  success: 'bg-emerald-50 text-emerald-600',
}

/** Small uppercase status pill (ATIVO, USADO, PENDENTE, etc.). */
export function Badge({ children, tone = 'primary', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  )
}
