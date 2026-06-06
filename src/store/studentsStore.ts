import { create } from 'zustand'
import type { Student } from '@/types'

/**
 * Shared source of truth for the gym's enrolled students (GET /Gym/Students/Select).
 * Not persisted — there is a real list endpoint, so it is refetched per session.
 * Keeping it in a store (instead of per-screen local state) lets a mutation on
 * one screen — approving a request, removing a student — reflect immediately on
 * the teacher dashboard and the students list at the same time.
 */
interface StudentsState {
  students: Student[]
  loaded: boolean
  setStudents: (students: Student[]) => void
  /** Adds or replaces a student by id_aluno (no duplicates). */
  upsertStudent: (student: Student) => void
  removeStudent: (id: string | number) => void
  /**
   * Reconciles a freshly-fetched server list with local state: server entries
   * win, but locally-added students the server doesn't return yet are kept
   * (so an optimistic enrollment survives a backend that lags or is mocked).
   */
  mergeStudents: (server: Student[]) => void
}

export const useStudentsStore = create<StudentsState>((set) => ({
  students: [],
  loaded: false,
  setStudents: (students) => set({ students, loaded: true }),
  upsertStudent: (student) =>
    set((s) => ({
      students: [
        student,
        ...s.students.filter((x) => x.id_aluno !== student.id_aluno),
      ],
    })),
  removeStudent: (id) =>
    set((s) => ({ students: s.students.filter((x) => x.id_aluno !== id) })),
  mergeStudents: (server) =>
    set((s) => {
      const serverIds = new Set(server.map((x) => x.id_aluno))
      const localOnly = s.students.filter((x) => !serverIds.has(x.id_aluno))
      return { students: [...server, ...localOnly], loaded: true }
    }),
}))
