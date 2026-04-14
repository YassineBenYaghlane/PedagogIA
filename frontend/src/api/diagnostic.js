import { api } from "./client"

export const diagnosticApi = {
  start: (studentId) =>
    api.post("/diagnostic/start/", { student_id: studentId }),
  next: (sessionId) =>
    api.get(`/diagnostic/${sessionId}/next/`),
  submit: (sessionId, signature, studentAnswer) =>
    api.post(`/sessions/${sessionId}/attempts/`, { signature, student_answer: studentAnswer }),
  result: (sessionId) =>
    api.get(`/diagnostic/${sessionId}/result/`)
}
