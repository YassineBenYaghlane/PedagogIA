import { create } from "zustand"
import { examApi } from "../api/exam"
import { invalidateSkillTree } from "../lib/queryClient"
import { useAuthStore } from "./authStore"
import { useBadgeStore } from "./badgeStore"

export const useExamStore = create((set, get) => ({
  sessionId: null,
  studentId: null,
  current: null,
  feedback: null,
  done: false,
  summary: null,
  loading: false,
  error: null,

  start: async (studentId) => {
    set({
      loading: true,
      error: null,
      feedback: null,
      current: null,
      done: false,
      summary: null
    })
    try {
      const data = await examApi.start(studentId)
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
      const res = await examApi.submit(
        sessionId,
        current.exercise.signature,
        answer
      )
      const { studentId } = get()
      if (res.gamification && studentId) {
        useAuthStore.getState().applyGamification(studentId, res.gamification)
        useBadgeStore.getState().push(res.gamification.newly_earned_badges)
      }
      invalidateSkillTree(studentId)
      set({
        feedback: res.feedback,
        loading: false
      })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  loadNext: async () => {
    const { sessionId } = get()
    if (!sessionId) return
    set({ loading: true, feedback: null })
    try {
      const data = await examApi.next(sessionId)
      if (data.done) {
        set({ done: true, summary: data.summary, current: null, loading: false })
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
      summary: null,
      error: null
    })
}))
