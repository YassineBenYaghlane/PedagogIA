import { create } from "zustand"
import { exercisesApi } from "../api/exercises"
import { chatApi } from "../api/chat"
import { invalidateSkillTree } from "../lib/queryClient"
import { captureException } from "../lib/errors"
import { useAuthStore } from "./authStore"
import { useBadgeStore } from "./badgeStore"
import { useChatStore } from "./chatStore"

const INITIAL = {
  sessionId: null,
  studentId: null,
  lockedSkillId: null,
  current: null,
  feedback: null,
  lastAttemptId: null,
  chatConversationId: null,
  chatNextSkillId: null,
  openingChat: false,
  loading: false,
  error: null
}

export const useSessionStore = create((set, get) => ({
  ...INITIAL,

  start: async (studentId, lockedSkillId = null) => {
    const { sessionId, loading } = get()
    if (sessionId || loading) return
    set({ ...INITIAL, loading: true, lockedSkillId })
    try {
      const session = await exercisesApi.createSession(studentId)
      set({ sessionId: session.id, studentId })
      await get().loadNext()
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  loadNext: async (overrideSkillId = null) => {
    const { studentId, chatNextSkillId, lockedSkillId } = get()
    if (!studentId) return
    const skill = overrideSkillId || lockedSkillId || chatNextSkillId || null
    set({
      loading: true,
      feedback: null,
      lastAttemptId: null,
      chatConversationId: null,
      chatNextSkillId: null,
      openingChat: false
    })
    useChatStore.getState().reset()
    try {
      const data = await exercisesApi.next(studentId, skill)
      set({ current: data, loading: false })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  retry: async () => {
    const { current } = get()
    const oldSig = current?.exercise?.signature
    if (!oldSig) return
    set({
      loading: true,
      feedback: null,
      lastAttemptId: null,
      chatConversationId: null,
      chatNextSkillId: null,
      openingChat: false,
      error: null
    })
    useChatStore.getState().reset()
    try {
      const { signature } = await exercisesApi.regenerateSignature(oldSig)
      set({
        current: { ...current, exercise: { ...current.exercise, signature } },
        loading: false
      })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  submit: async (answer) => {
    const { sessionId, current } = get()
    if (!sessionId || !current) return
    set({
      loading: true,
      chatConversationId: null,
      chatNextSkillId: null,
      openingChat: false
    })
    try {
      const res = await exercisesApi.submit(sessionId, current.exercise.signature, answer)
      const { studentId } = get()
      if (res.gamification && studentId) {
        useAuthStore.getState().applyGamification(studentId, res.gamification)
        useBadgeStore.getState().push(res.gamification.newly_earned_badges)
      }
      invalidateSkillTree(studentId)
      set({
        feedback: res.feedback,
        lastAttemptId: res.attempt?.id || null,
        loading: false
      })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  openChat: async () => {
    const { lastAttemptId, openingChat, chatConversationId, studentId } = get()
    if (!lastAttemptId || openingChat || chatConversationId) return
    set({ openingChat: true })
    try {
      const { conversation_id, next_skill_id } = await chatApi.openForAttempt(lastAttemptId)
      set({
        chatConversationId: conversation_id,
        chatNextSkillId: next_skill_id || null,
        openingChat: false
      })
      const chat = useChatStore.getState()
      if (studentId) chat.loadConversations(studentId)
      await chat.selectConversation(conversation_id)
    } catch (err) {
      set({ openingChat: false, error: err.message })
    }
  },

  openChatForExercise: async () => {
    const { current, openingChat, chatConversationId, studentId } = get()
    if (!current?.exercise?.signature || openingChat || chatConversationId || !studentId) return
    set({ openingChat: true })
    try {
      const { conversation_id } = await chatApi.openForExercise({
        studentId,
        signature: current.exercise.signature,
        prompt: current.exercise.prompt || ""
      })
      set({ chatConversationId: conversation_id, openingChat: false })
      const chat = useChatStore.getState()
      chat.loadConversations(studentId)
      await chat.selectConversation(conversation_id)
    } catch (err) {
      set({ openingChat: false, error: err.message })
    }
  },

  closeChat: () => {
    set({ chatConversationId: null, chatNextSkillId: null })
    useChatStore.getState().reset()
  },

  stop: async () => {
    const { sessionId } = get()
    if (sessionId) {
      try {
        await exercisesApi.endSession(sessionId)
      } catch (err) {
        captureException(err, { where: "sessionStore.stop", sessionId })
      }
    }
    useChatStore.getState().reset()
    set({ ...INITIAL })
  },

  reset: () => {
    useChatStore.getState().reset()
    set({ ...INITIAL })
  }
}))
