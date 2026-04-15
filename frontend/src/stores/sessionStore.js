import { create } from "zustand"
import { exercisesApi } from "../api/exercises"

const INITIAL = {
  sessionId: null,
  studentId: null,
  lockedSkillId: null,
  current: null,
  feedback: null,
  lastAttemptId: null,
  explanation: null,
  explaining: false,
  loading: false,
  error: null
}

export const useSessionStore = create((set, get) => ({
  ...INITIAL,

  start: async (studentId, lockedSkillId = null) => {
    set({ ...INITIAL, loading: true, lockedSkillId })
    try {
      const session = await exercisesApi.createSession(studentId)
      set({ sessionId: session.id, studentId })
      await get().loadNext()
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  loadNext: async () => {
    const { studentId, explanation, lockedSkillId } = get()
    if (!studentId) return
    const override = lockedSkillId || explanation?.next_skill_id || null
    set({
      loading: true,
      feedback: null,
      lastAttemptId: null,
      explanation: null,
      explaining: false
    })
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
    set({ loading: true, explanation: null, explaining: false })
    try {
      const res = await exercisesApi.submit(sessionId, current.exercise.signature, answer)
      set({
        feedback: res.feedback,
        lastAttemptId: res.attempt?.id || null,
        loading: false
      })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  explain: async () => {
    const { lastAttemptId, explaining, explanation } = get()
    if (!lastAttemptId || explaining || explanation) return
    set({ explaining: true })
    try {
      const data = await exercisesApi.explain(lastAttemptId)
      set({ explanation: data, explaining: false })
    } catch (err) {
      set({ explaining: false, error: err.message })
    }
  },

  stop: async () => {
    const { sessionId } = get()
    if (sessionId) {
      try { await exercisesApi.endSession(sessionId) } catch { /* ignore */ }
    }
    set({ ...INITIAL })
  },

  reset: () => set({ ...INITIAL })
}))
