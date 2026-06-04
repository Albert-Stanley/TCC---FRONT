import { Moon, Sun } from 'lucide-react'
import { useThemeStore } from '@/store/themeStore'

/**
 * Light/dark theme toggle. `variant="bar"` renders a full-width labelled row
 * (settings list); the default renders a compact icon button (top bars/sidebar).
 */
export function ThemeToggle({
  variant = 'icon',
  className = '',
}: {
  variant?: 'icon' | 'bar'
  className?: string
}) {
  const theme = useThemeStore((s) => s.theme)
  const toggle = useThemeStore((s) => s.toggle)
  const isDark = theme === 'dark'
  const Icon = isDark ? Sun : Moon

  if (variant === 'bar') {
    return (
      <button
        type="button"
        onClick={toggle}
        className={`flex w-full items-center justify-between rounded-2xl border border-line bg-surface px-4 py-3.5 shadow-soft transition-colors hover:border-content/20 ${className}`}
      >
        <span className="flex items-center gap-3">
          <Icon size={20} className="text-primary" />
          <span className="text-sm font-semibold text-content">
            {isDark ? 'Tema escuro' : 'Tema claro'}
          </span>
        </span>
        <span
          className={`relative h-6 w-11 rounded-full transition-colors ${
            isDark ? 'bg-primary' : 'bg-line'
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
              isDark ? 'left-[22px]' : 'left-0.5'
            }`}
          />
        </span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
      className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${className}`}
    >
      <Icon size={20} />
    </button>
  )
}
