import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Invite } from '@/types'

/**
 * Caches invite links generated via POST /Gym/Invite/Generate. There is no
 * list-invites endpoint in the authoritative map, so the teacher's Convites
 * screen and dashboard share this in-session record.
 */
interface InviteState {
  invites: Invite[]
  addInvite: (invite: Invite) => void
  removeInvite: (id: string | number) => void
}

export const useInviteStore = create<InviteState>()(
  persist(
    (set) => ({
      invites: [],
      addInvite: (invite) =>
        set((s) => ({ invites: [invite, ...s.invites] })),
      removeInvite: (id) =>
        set((s) => ({ invites: s.invites.filter((i) => i.id !== id) })),
    }),
    { name: 'kravconnect-invites' },
  ),
)
