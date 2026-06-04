import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Gym } from '@/types'

/**
 * Holds the teacher's current gym. The authoritative endpoint map has no
 * "get my gym" route, so we cache the gym created via POST /Gym/Create to
 * drive the dashboard hero. Cleared on logout from the auth flow.
 */
interface GymState {
  gym: Gym | null
  setGym: (gym: Gym | null) => void
}

export const useGymStore = create<GymState>()(
  persist(
    (set) => ({
      gym: null,
      setGym: (gym) => set({ gym }),
    }),
    { name: 'kravconnect-gym' },
  ),
)
