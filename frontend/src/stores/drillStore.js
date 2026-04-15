import { create } from "zustand"
import { drillApi } from "../api/drill"
import { useAuthStore } from "./authStore"
import { useBadgeStore } from "./badgeStore"

export const useDrillStore = create((set, get) => ({
  sessionId: null,
  studentId: null,
  current: null,
  feedback: null,
  done: false,
  summary: null,
  streak: 0,
  bestStreak: 0,
  loading: false,
  error: null,

  start: async (studentId) => {
    set({
      loading: true,
      error: null,
      feedback: null,
      current: null,
      done: false,
      summary: null,
      streak: 0,
      bestStreak: 0
    })
    try {
      const data = await drillApi.start(studentId)
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
    const { sessionId, current, streak, bestStreak } = get()
    if (!sessionId || !current) return
    set({ loading: true })
    try {
      const res = await drillApi.submit(
        sessionId,
        current.exercise.signature,
        answer
      )
      const ok = res.feedback.is_correct
      const nextStreak = ok ? streak + 1 : 0
      const { studentId } = get()
      if (res.gamification && studentId) {
        useAuthStore.getState().applyGamification(studentId, res.gamification)
        useBadgeStore.getState().push(res.gamification.newly_earned_badges)
      }
      set({
        feedback: res.feedback,
        streak: nextStreak,
        bestStreak: Math.max(bestStreak, nextStreak),
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
      const data = await drillApi.next(sessionId)
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
      streak: 0,
      bestStreak: 0,
      error: null
    })
}))
