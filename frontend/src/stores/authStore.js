import { create } from "zustand"
import { api } from "../api/client"

export const useAuthStore = create((set, get) => ({
  parent: null,
  children: [],
  selectedChildId: null,
  loading: true,
  error: null,

  bootstrap: async () => {
    set({ loading: true, error: null })
    try {
      await api.bootstrapCsrf()
      const parent = await api.get("/auth/user/")
      set({
        parent,
        children: parent.children || [],
        loading: false
      })
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        set({ parent: null, children: [], loading: false })
      } else {
        set({ error: err.message, loading: false })
      }
    }
  },

  login: async (email, password) => {
    set({ error: null })
    await api.post("/auth/login/", { email, password })
    await get().bootstrap()
  },

  register: async (email, password, displayName) => {
    set({ error: null })
    await api.post("/auth/registration/", {
      email,
      password1: password,
      password2: password,
      display_name: displayName || ""
    })
    await get().bootstrap()
  },

  logout: async () => {
    try { await api.post("/auth/logout/") } catch { /* ignore */ }
    set({ parent: null, children: [], selectedChildId: null })
  },

  addChild: async (displayName, grade) => {
    const child = await api.post("/students/", { display_name: displayName, grade })
    set({ children: [...get().children, child] })
    return child
  },

  selectChild: (id) => set({ selectedChildId: id })
}))
