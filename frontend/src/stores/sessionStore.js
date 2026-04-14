import { create } from "zustand"
import { exercisesApi } from "../api/exercises"

export const useSessionStore = create((set, get) => ({
  sessionId: null,
  studentId: null,
  lockedSkillId: null,
  current: null,
  feedback: null,
  loading: false,
  error: null,

  start: async (studentId, lockedSkillId = null) => {
    set({ loading: true, error: null, feedback: null, current: null, lockedSkillId })
    try {
      const session = await exercisesApi.createSession(studentId)
      set({ sessionId: session.id, studentId })
      await get().loadNext()
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  loadNext: async () => {
    const { studentId, feedback, lockedSkillId } = get()
    if (!studentId) return
    const override = lockedSkillId || feedback?.next_skill_id || null
    set({ loading: true, feedback: null })
    try {
      const data = await exercisesApi.next(studentId, override)
      set({ current: data, loading: false })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  submit: async (answer) => {
    const { sessionId, current } = get()
    if (!sessionId || !current) return
    set({ loading: true })
    try {
      const res = await exercisesApi.submit(sessionId, current.exercise.signature, answer)
      set({ feedback: res.feedback, loading: false })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  stop: async () => {
    const { sessionId } = get()
    if (sessionId) {
      try { await exercisesApi.endSession(sessionId) } catch { /* ignore */ }
    }
    set({ sessionId: null, studentId: null, lockedSkillId: null, current: null, feedback: null })
  },

  reset: () =>
    set({
      sessionId: null,
      studentId: null,
      lockedSkillId: null,
      current: null,
      feedback: null,
      error: null
    })
}))
