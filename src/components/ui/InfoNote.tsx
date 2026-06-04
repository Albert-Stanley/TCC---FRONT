import type { ReactNode } from 'react'
import { Info } from 'lucide-react'

/** Soft tinted note box with an info icon (used on forms). */
export function InfoNote({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-primary-soft px-4 py-3.5">
      <Info size={18} className="mt-0.5 shrink-0 text-primary" />
      <p className="text-sm leading-relaxed text-content/80">{children}</p>
    </div>
  )
}
