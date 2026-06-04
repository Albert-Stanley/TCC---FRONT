import { Star } from 'lucide-react'

/** Compact star rating with the score and (optional) review count. */
export function Stars({
  rating,
  reviews,
  className = '',
}: {
  rating: number
  reviews?: number
  className?: string
}) {
  return (
    <span className={`flex items-center gap-1 text-xs text-muted ${className}`}>
      <Star size={13} className="fill-amber-400 text-amber-400" />
      <span className="font-semibold text-content">{rating.toFixed(1)}</span>
      {reviews != null && <span>({reviews})</span>}
    </span>
  )
}
