interface SectionTitleProps {
  children: string
  /** Show the short red accent bar beside the title. */
  underline?: boolean
  className?: string
}

/** Bold UPPERCASE section heading, optionally with the red accent bar. */
export function SectionTitle({
  children,
  underline = false,
  className = '',
}: SectionTitleProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {underline && (
        <span className="h-5 w-1 shrink-0 rounded-full bg-primary" />
      )}
      <h2 className="font-display text-base font-bold uppercase tracking-tight text-content">
        {children}
      </h2>
    </div>
  )
}
