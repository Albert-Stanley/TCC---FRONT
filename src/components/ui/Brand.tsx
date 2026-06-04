import { Logo } from '@/components/ui/Logo'
import { Wordmark } from '@/components/ui/Wordmark'

/**
 * Brand lockup: emblem tile + KRAVCONNECT wordmark. Keeps the logo + name pairing
 * consistent across the login, home top bars and the desktop sidebar.
 */
export function Brand({
  size = 30,
  className = '',
  wordmarkClassName = 'text-lg',
}: {
  size?: number
  className?: string
  wordmarkClassName?: string
}) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <Logo size={size} />
      <Wordmark className={wordmarkClassName} />
    </span>
  )
}
