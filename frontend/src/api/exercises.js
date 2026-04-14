import { api } from "./client"

export const exercisesApi = {
  next: (studentId, skillId = null) => {
    const params = new URLSearchParams({ student_id: studentId })
    if (skillId) params.set("skill_id", skillId)
    return api.get(`/exercises/next/?${params.toString()}`)
  },
  generate: (skillId, difficulty = 1) =>
    api.get(`/exercises/generate/?skill_id=${encodeURIComponent(skillId)}&difficulty=${difficulty}`),
  submit: (sessionId, signature, studentAnswer) =>
    api.post(`/sessions/${sessionId}/attempts/`, { signature, student_answer: studentAnswer }),
  createSession: (studentId, mode = "learn") =>
    api.post("/sessions/", { student: studentId, mode }),
  endSession: (sessionId) =>
    api.patch(`/sessions/${sessionId}/`, { ended_at: new Date().toISOString() })
}
