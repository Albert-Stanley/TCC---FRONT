import { Minus, Plus } from 'lucide-react'

/** Rounded -/+ quantity control. `max` caps the value (e.g. available stock). */
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max,
  size = 'md',
}: {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  size?: 'sm' | 'md'
}) {
  const btn = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10'
  const atMax = max != null && value >= max
  return (
    <div className="inline-flex items-center rounded-full border border-line bg-surface">
      <button
        type="button"
        aria-label="Diminuir quantidade"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className={`flex ${btn} items-center justify-center rounded-full text-content transition-colors hover:text-primary disabled:opacity-40`}
      >
        <Minus size={16} />
      </button>
      <span className="min-w-7 text-center text-sm font-bold tabular-nums text-content">
        {value}
      </span>
      <button
        type="button"
        aria-label="Aumentar quantidade"
        onClick={() => onChange(max != null ? Math.min(max, value + 1) : value + 1)}
        disabled={atMax}
        className={`flex ${btn} items-center justify-center rounded-full text-content transition-colors hover:text-primary disabled:opacity-40`}
      >
        <Plus size={16} />
      </button>
    </div>
  )
}
