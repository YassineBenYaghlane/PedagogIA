import { api } from "./client"

export const examApi = {
  start: (studentId) =>
    api.post("/exam/start/", { student_id: studentId }),
  next: (sessionId) =>
    api.get(`/exam/${sessionId}/next/`),
  submit: (sessionId, signature, studentAnswer) =>
    api.post(`/sessions/${sessionId}/attempts/`, { signature, student_answer: studentAnswer }),
  result: (sessionId) =>
    api.get(`/exam/${sessionId}/result/`)
}
