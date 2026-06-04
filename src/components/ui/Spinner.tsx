import { Loader2 } from 'lucide-react'

/** Centered loading spinner for async screen/section states. */
export function Spinner({ label = 'Carregando...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-14 text-muted">
      <Loader2 size={26} className="animate-spin text-primary" />
      <p className="text-sm">{label}</p>
    </div>
  )
}
