import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  message: string
  /** Optional call-to-action rendered below the message. */
  action?: { label: string; onClick: () => void }
}

/** Centered placeholder for empty lists. */
export function EmptyState({ icon: Icon, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-line bg-surface px-6 py-12 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-canvas text-muted">
        <Icon size={26} strokeWidth={1.75} />
      </span>
      <p className="max-w-[260px] text-sm leading-relaxed text-muted">{message}</p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-1 rounded-lg px-3 py-1.5 text-sm font-semibold uppercase tracking-wide text-primary transition-colors hover:bg-primary-soft"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
