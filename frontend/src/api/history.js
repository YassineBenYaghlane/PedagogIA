import { api } from "./client"

export const historyApi = {
  listSessions: (studentId) => {
    const params = new URLSearchParams({ summary: "1", student: studentId })
    return api.get(`/sessions/?${params.toString()}`)
  },
  exportPdf: (studentId) => downloadBlob(`/api/students/${studentId}/export.pdf/`),
  exportJson: (studentId) => downloadBlob(`/api/students/${studentId}/export.json/`)
}

async function downloadBlob(url) {
  const res = await fetch(url, { credentials: "include" })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const buffer = await res.arrayBuffer()
  const blob = new Blob([buffer], { type: "application/octet-stream" })
  const filename = parseFilename(res.headers.get("Content-Disposition")) || "export"
  const objectUrl = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = objectUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(objectUrl)
}

function parseFilename(header) {
  if (!header) return null
  const match = header.match(/filename="?([^";]+)"?/i)
  return match ? match[1] : null
}
