import { api } from "./client"

export const fetchSession = (sessionId) => api.get(`/sessions/${sessionId}/`)
export const fetchSessionAttempts = (sessionId) => api.get(`/sessions/${sessionId}/attempts/`)

export function downloadSessionExport(sessionId) {
  const a = document.createElement("a")
  a.href = `/api/sessions/${sessionId}/export.json/`
  a.rel = "noopener"
  a.target = "_self"
  document.body.appendChild(a)
  a.click()
  a.remove()
}
