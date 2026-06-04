import { create } from 'zustand'

export interface AppNotification {
  id: string
  title: string
  description?: string
  /** Route to open when the item is tapped. */
  to?: string
}

interface NotificationState {
  items: AppNotification[]
  setItems: (items: AppNotification[]) => void
  clear: () => void
}

/**
 * Lightweight, in-memory notification feed. Screens publish contextual items
 * (e.g. the teacher dashboard pushes pending join requests) and the
 * `NotificationsMenu` — rendered in the mobile top bars and the desktop
 * sidebar — reads from here, so the bell reflects real state instead of being
 * decorative.
 */
export const useNotificationStore = create<NotificationState>((set) => ({
  items: [],
  setItems: (items) => set({ items }),
  clear: () => set({ items: [] }),
}))
