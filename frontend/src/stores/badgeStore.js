import { create } from "zustand"

export const useBadgeStore = create((set, get) => ({
  queue: [],

  push: (badges) => {
    if (!badges || badges.length === 0) return
    set({ queue: [...get().queue, ...badges] })
  },

  shift: () => {
    const [, ...rest] = get().queue
    set({ queue: rest })
  },

  clear: () => set({ queue: [] })
}))
