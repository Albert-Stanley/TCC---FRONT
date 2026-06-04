import type { ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'

/** Inline form error banner with a soft red fill. */
export function FormError({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-2xl bg-primary-soft px-4 py-3.5 text-sm font-medium text-primary"
    >
      <AlertCircle size={18} className="mt-0.5 shrink-0" />
      <span className="leading-relaxed">{children}</span>
    </div>
  )
}
