import type { ReactNode } from 'react'

interface FormLayoutProps {
  /** Primary content (the form / action). Left column on desktop. */
  children: ReactNode
  /**
   * Supporting context — a summary, help steps, identity, etc. Rendered on top
   * on mobile and in a right column on desktop, so single-action screens fill
   * the width instead of leaving a void.
   */
  aside?: ReactNode
}

/**
 * Layout for form / single-action screens. Keeps the form at a readable width
 * (never stretched edge-to-edge on desktop) and, when an `aside` is provided,
 * pairs it side-by-side so the screen reads like a real web app.
 */
export function FormLayout({ children, aside }: FormLayoutProps) {
  if (!aside) {
    return (
      <div className="px-6 py-6 lg:py-10">
        <div className="mx-auto flex w-full max-w-md flex-col gap-5">
          {children}
        </div>
      </div>
    )
  }

  return (
    <div className="px-6 py-6 lg:py-10">
      {/* grid-cols-1 (minmax(0,1fr)) lets the columns shrink below their
          content's intrinsic width on mobile — otherwise long unbreakable
          content (e-mails, codes) pushes the cards wider than the screen. */}
      <div className="mx-auto grid w-full max-w-4xl grid-cols-1 items-start gap-6 lg:grid-cols-2 lg:gap-12">
        <aside className="order-first flex min-w-0 flex-col gap-4 lg:order-last">
          {aside}
        </aside>
        <div className="flex min-w-0 flex-col gap-5">{children}</div>
      </div>
    </div>
  )
}
