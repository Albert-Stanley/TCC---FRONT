import { create } from 'zustand'
import type { InviteRequest } from '@/types'

/**
 * Shared source of truth for pending join requests (GET /Gym/Invite/Requests).
 * Shared so the dashboard's "pending" badge and the Requests screen stay in
 * sync when a teacher approves or refuses a request.
 */
interface RequestsState {
  requests: InviteRequest[]
  loaded: boolean
  setRequests: (requests: InviteRequest[]) => void
  setStatus: (
    id: string | number,
    status: 'pending' | 'approved' | 'refused',
  ) => void
}

export const useRequestsStore = create<RequestsState>((set) => ({
  requests: [],
  loaded: false,
  setRequests: (requests) => set({ requests, loaded: true }),
  setStatus: (id, status) =>
    set((s) => ({
      requests: s.requests.map((r) =>
        r.id_aluno === id ? { ...r, status } : r,
      ),
    })),
}))
