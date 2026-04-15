import { create } from "zustand"
import { api } from "../api/client"

const STORAGE_KEY = "pedagogia.selectedChildId"

const readSelected = () => {
  try {
    return typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null
  } catch {
    return null
  }
}

const writeSelected = (id) => {
  try {
    if (typeof localStorage === "undefined") return
    if (id) localStorage.setItem(STORAGE_KEY, id)
    else localStorage.removeItem(STORAGE_KEY)
  } catch { /* ignore */ }
}

export const useAuthStore = create((set, get) => ({
  parent: null,
  children: [],
  selectedChildId: readSelected(),
  loading: true,
  error: null,

  bootstrap: async () => {
    set({ loading: true, error: null })
    try {
      await api.bootstrapCsrf()
      const parent = await api.get("/auth/user/")
      const children = parent?.children || []
      const stored = readSelected()
      const selectedChildId = children.some((c) => c.id === stored) ? stored : null
      set({
        parent,
        children,
        selectedChildId,
        loading: false
      })
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        set({ parent: null, children: [], selectedChildId: null, loading: false })
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

  googleLogin: async (code) => {
    set({ error: null })
    await api.post("/auth/google/", { code })
    await get().bootstrap()
  },

  logout: async () => {
    try { await api.post("/auth/logout/") } catch { /* ignore */ }
    writeSelected(null)
    set({ parent: null, children: [], selectedChildId: null })
  },

  addChild: async (displayName, grade) => {
    const child = await api.post("/students/", { display_name: displayName, grade })
    set({ children: [...get().children, child] })
    return child
  },

  selectChild: (id) => {
    writeSelected(id)
    set({ selectedChildId: id })
  }
}))
