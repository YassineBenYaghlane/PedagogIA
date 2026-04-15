import { create } from "zustand"
import { diagnosticApi } from "../api/diagnostic"
import { useAuthStore } from "./authStore"
import { useBadgeStore } from "./badgeStore"

export const useDiagnosticStore = create((set, get) => ({
  sessionId: null,
  studentId: null,
  current: null,
  feedback: null,
  done: false,
  result: null,
  loading: false,
  error: null,

  start: async (studentId) => {
    set({
      loading: true,
      error: null,
      feedback: null,
      current: null,
      done: false,
      result: null
    })
    try {
      const data = await diagnosticApi.start(studentId)
      set({
        sessionId: data.session_id,
        studentId,
        current: data.question,
        loading: false
      })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  submit: async (answer) => {
    const { sessionId, current } = get()
    if (!sessionId || !current) return
    set({ loading: true })
    try {
      const res = await diagnosticApi.submit(
        sessionId,
        current.exercise.signature,
        answer
      )
      const { studentId } = get()
      if (res.gamification && studentId) {
        useAuthStore.getState().applyGamification(studentId, res.gamification)
        useBadgeStore.getState().push(res.gamification.newly_earned_badges)
      }
      set({ feedback: res.feedback, loading: false })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  loadNext: async () => {
    const { sessionId } = get()
    if (!sessionId) return
    set({ loading: true, feedback: null })
    try {
      const data = await diagnosticApi.next(sessionId)
      if (data.done) {
        const result = await diagnosticApi.result(sessionId)
        set({ done: true, result, current: null, loading: false })
      } else {
        set({ current: data.question, loading: false })
      }
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  reset: () =>
    set({
      sessionId: null,
      studentId: null,
      current: null,
      feedback: null,
      done: false,
      result: null,
      error: null
    })
}))
