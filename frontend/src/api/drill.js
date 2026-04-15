import { api } from "./client"

export const drillApi = {
  start: (studentId) =>
    api.post("/drill/start/", { student_id: studentId }),
  next: (sessionId) =>
    api.get(`/drill/${sessionId}/next/`),
  submit: (sessionId, signature, studentAnswer) =>
    api.post(`/sessions/${sessionId}/attempts/`, { signature, student_answer: studentAnswer }),
  result: (sessionId) =>
    api.get(`/drill/${sessionId}/result/`)
}
