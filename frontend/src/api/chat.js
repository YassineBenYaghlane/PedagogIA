import { api } from "./client"

const CSRF_COOKIE = import.meta.env.VITE_CSRF_COOKIE_NAME || "csrftoken"

function readCookie(name) {
  const match = document.cookie.match(new RegExp("(^|; )" + name + "=([^;]*)"))
  return match ? decodeURIComponent(match[2]) : null
}

export const chatApi = {
  list: (studentId) => api.get(`/students/${studentId}/conversations/`),

  create: (studentId, title) =>
    api.post(`/students/${studentId}/conversations/`, title ? { title } : {}),

  get: (conversationId) => api.get(`/conversations/${conversationId}/`),

  rename: (conversationId, title) =>
    api.patch(`/conversations/${conversationId}/`, { title }),

  delete: (conversationId) =>
    api.delete(`/conversations/${conversationId}/`),

  openForAttempt: (attemptId) =>
    api.post(`/attempts/${attemptId}/open-chat/`),

  openForExercise: ({ studentId, signature, prompt }) =>
    api.post("/exercises/open-chat/", {
      student_id: studentId,
      signature,
      prompt: prompt || ""
    }),

  async streamMessage(conversationId, content, { onChunk, onDone, onError, signal } = {}) {
    const headers = { "Content-Type": "application/json" }
    const token = readCookie(CSRF_COOKIE)
    if (token) headers["X-CSRFToken"] = token
    const res = await fetch(`/api/conversations/${conversationId}/messages/send/`, {
      method: "POST",
      credentials: "include",
      headers,
      body: JSON.stringify({ content }),
      signal
    })
    if (!res.ok) {
      const text = await res.text()
      const err = new Error(`HTTP ${res.status}`)
      err.status = res.status
      err.body = text
      throw err
    }
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop()
      for (const raw of lines) {
        const line = raw.trim()
        if (!line) continue
        let frame
        try {
          frame = JSON.parse(line)
        } catch {
          continue
        }
        if (frame.type === "chunk") onChunk?.(frame.text)
        else if (frame.type === "done") onDone?.(frame)
        else if (frame.type === "error") onError?.(new Error(frame.detail))
      }
    }
  }
}
