/** KRAVCONNECT wordmark — "KRAV" in current color, "CONNECT" in red. */
export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span
      className={`font-display font-extrabold uppercase leading-none tracking-tight ${className}`}
    >
      Krav<span className="text-primary">connect</span>
    </span>
  )
}
