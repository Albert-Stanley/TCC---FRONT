import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GymClass } from '@/types'

/**
 * Caches classes created by the teacher. The authoritative endpoint map has no
 * "list classes" route, so the classes (and their content) are kept here to
 * drive both the teacher manager and the student's content screen.
 * Cleared on logout from the auth flow.
 */
interface ClassState {
  classes: GymClass[]
  addClass: (c: GymClass) => void
  addContent: (id: string, content: string) => void
  removeClass: (id: string) => void
}

export const useClassStore = create<ClassState>()(
  persist(
    (set) => ({
      classes: [],
      addClass: (c) => set((s) => ({ classes: [c, ...s.classes] })),
      addContent: (id, content) =>
        set((s) => ({
          classes: s.classes.map((c) =>
            c.id === id ? { ...c, contents: [...c.contents, content] } : c,
          ),
        })),
      removeClass: (id) =>
        set((s) => ({ classes: s.classes.filter((c) => c.id !== id) })),
    }),
    { name: 'kravconnect-classes' },
  ),
)
