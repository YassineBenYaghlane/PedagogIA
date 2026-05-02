import { create } from "zustand"
import { chatApi } from "../api/chat"

const initialState = {
  studentId: null,
  conversations: [],
  currentId: null,
  messages: [],
  loadingList: false,
  loadingConversation: false,
  sending: false,
  streamingText: "",
  error: null
}

export const useChatStore = create((set, get) => ({
  ...initialState,

  reset: () => set(initialState),

  async loadConversations(studentId) {
    if (!studentId) return
    set({ loadingList: true, error: null, studentId })
    try {
      const list = await chatApi.list(studentId)
      set({ conversations: list, loadingList: false })
    } catch (err) {
      set({ loadingList: false, error: err.message })
    }
  },

  async selectConversation(id) {
    if (!id) {
      set({ currentId: null, messages: [], streamingText: "" })
      return
    }
    set({ currentId: id, loadingConversation: true, error: null, streamingText: "" })
    try {
      const conv = await chatApi.get(id)
      set({ messages: conv.messages || [], loadingConversation: false })
    } catch (err) {
      set({ loadingConversation: false, error: err.message })
    }
  },

  async deleteConversation(id) {
    if (!id) return
    try {
      await chatApi.delete(id)
      set((s) => {
        const remaining = s.conversations.filter((c) => c.id !== id)
        const wasCurrent = s.currentId === id
        return {
          conversations: remaining,
          currentId: wasCurrent ? null : s.currentId,
          messages: wasCurrent ? [] : s.messages,
          streamingText: wasCurrent ? "" : s.streamingText,
          error: null
        }
      })
    } catch (err) {
      set({ error: err.message })
    }
  },

  async createConversation(studentId, title) {
    if (!studentId) return null
    set({ error: null })
    try {
      const conv = await chatApi.create(studentId, title)
      set((s) => ({
        conversations: [conv, ...s.conversations],
        currentId: conv.id,
        messages: []
      }))
      return conv
    } catch (err) {
      set({ error: err.message })
      return null
    }
  },

  async send(content) {
    const { currentId, sending, studentId } = get()
    if (!currentId || sending || !content.trim()) return
    const studentMsg = {
      id: `local-${Date.now()}`,
      role: "student",
      content,
      created_at: new Date().toISOString()
    }
    set((s) => ({
      messages: [...s.messages, studentMsg],
      sending: true,
      streamingText: "",
      error: null
    }))
    try {
      await chatApi.streamMessage(currentId, content, {
        onChunk: (text) =>
          set((s) => ({ streamingText: s.streamingText + text })),
        onDone: ({ message_id, model, speech }) => {
          set((s) => ({
            messages: [
              ...s.messages,
              {
                id: message_id,
                role: "assistant",
                content: s.streamingText,
                speech: speech || "",
                model,
                created_at: new Date().toISOString()
              }
            ],
            streamingText: "",
            sending: false
          }))
          if (studentId) get().loadConversations(studentId)
        },
        onError: (err) =>
          set({ error: err.message, sending: false, streamingText: "" })
      })
    } catch (err) {
      set({ error: err.message, sending: false, streamingText: "" })
    }
  }
}))
