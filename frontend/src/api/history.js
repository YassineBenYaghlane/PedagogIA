import { api } from "./client"

export const fetchSessionSummaries = (studentId) =>
  api.get(`/sessions/?summary=1&student=${studentId}`)

export function downloadStudentExport(studentId, format) {
  const ext = format === "pdf" ? "pdf" : "json"
  const url = `/api/students/${studentId}/export.${ext}/`
  const a = document.createElement("a")
  a.href = url
  a.rel = "noopener"
  a.target = "_self"
  document.body.appendChild(a)
  a.click()
  a.remove()
}

export function downloadDiagnosticPdf(sessionId) {
  const a = document.createElement("a")
  a.href = `/api/sessions/${sessionId}/diagnostic.pdf/`
  a.rel = "noopener"
  a.target = "_self"
  document.body.appendChild(a)
  a.click()
  a.remove()
}
