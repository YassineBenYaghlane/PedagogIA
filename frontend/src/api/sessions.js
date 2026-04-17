import { api } from "./client"

export const fetchSession = (sessionId) => api.get(`/sessions/${sessionId}/`)
export const fetchSessionAttempts = (sessionId) => api.get(`/sessions/${sessionId}/attempts/`)
