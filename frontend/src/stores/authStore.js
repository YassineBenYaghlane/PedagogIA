import { create } from "zustand"
import { api } from "../api/client"
import { accountApi } from "../api/account"
import { studentsApi } from "../api/students"

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
  user: null,
  children: [],
  selectedChildId: readSelected(),
  loading: true,
  error: null,

  bootstrap: async () => {
    const hadUser = get().user !== null
    set({ loading: !hadUser, error: null })
    try {
      await api.bootstrapCsrf()
      const user = await api.get("/auth/user/")
      const children = user?.children || []
      const stored = readSelected()
      const selectedChildId = children.some((c) => c.id === stored) ? stored : null
      set({
        user,
        children,
        selectedChildId,
        loading: false
      })
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        set({ user: null, children: [], selectedChildId: null, loading: false })
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
    set({ user: null, children: [], selectedChildId: null })
  },

  addChild: async (displayName, grade) => {
    const child = await api.post("/students/", { display_name: displayName, grade })
    set({ children: [...get().children, child] })
    return child
  },

  updateUser: async (patch) => {
    const updated = await accountApi.updateUser(patch)
    set({ user: { ...get().user, ...updated } })
    return updated
  },

  changePassword: async ({ oldPassword, newPassword }) => {
    return accountApi.changePassword({ oldPassword, newPassword })
  },

  updateChild: async (id, patch) => {
    const updated = await studentsApi.update(id, patch)
    set({
      children: get().children.map((c) => (c.id === id ? { ...c, ...updated } : c))
    })
    return updated
  },

  removeChild: async (id) => {
    await studentsApi.remove(id)
    const { selectedChildId } = get()
    set({
      children: get().children.filter((c) => c.id !== id),
      selectedChildId: selectedChildId === id ? null : selectedChildId
    })
    if (selectedChildId === id) writeSelected(null)
  },

  selectChild: (id) => {
    writeSelected(id)
    set({ selectedChildId: id })
  },

  applyGamification: (studentId, g) => {
    if (!g) return
    const { children } = get()
    set({
      children: children.map((c) =>
        c.id === studentId
          ? {
              ...c,
              xp: g.xp_total ?? c.xp,
              rank: g.rank ?? c.rank,
              current_streak: g.current_streak ?? c.current_streak,
              best_streak: g.best_streak ?? c.best_streak,
              daily_goal: g.daily_goal ?? c.daily_goal,
              daily_progress: g.daily_progress ?? c.daily_progress,
              achievements: [
                ...(g.newly_earned_badges || []).map((b) => ({
                  code: b.code,
                  label: b.label,
                  description: b.description,
                  icon: b.icon,
                  tier: b.tier,
                  earned_at: new Date().toISOString()
                })),
                ...(c.achievements || [])
              ]
            }
          : c
      )
    })
  }
}))
