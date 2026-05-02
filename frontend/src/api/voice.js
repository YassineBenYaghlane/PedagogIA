const CSRF_COOKIE = import.meta.env.VITE_CSRF_COOKIE_NAME || "csrftoken"

function readCookie(name) {
  const match = document.cookie.match(new RegExp("(^|; )" + name + "=([^;]*)"))
  return match ? decodeURIComponent(match[2]) : null
}

function csrfHeaders(extra = {}) {
  const headers = { ...extra }
  const token = readCookie(CSRF_COOKIE)
  if (token) headers["X-CSRFToken"] = token
  return headers
}

export class VoiceQuotaError extends Error {
  constructor(used, cap) {
    super("voice quota exceeded")
    this.name = "VoiceQuotaError"
    this.used = used
    this.cap = cap
  }
}

export const voiceApi = {
  async tts(text, voice = "female", studentId) {
    const res = await fetch("/api/voice/tts/", {
      method: "POST",
      credentials: "include",
      headers: csrfHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ text, voice, student_id: studentId })
    })
    if (res.status === 429) {
      const data = await res.json().catch(() => ({}))
      throw new VoiceQuotaError(data.used ?? 0, data.cap ?? 0)
    }
    if (!res.ok) throw new Error(`tts HTTP ${res.status}`)
    const blob = await res.blob()
    const used = parseInt(res.headers.get("X-Voice-Chars-Used") || "0", 10)
    const cap = parseInt(res.headers.get("X-Voice-Chars-Cap") || "0", 10)
    return { blob, used, cap }
  },

  async stt(blob) {
    const form = new FormData()
    form.append("audio", blob, "clip.webm")
    const res = await fetch("/api/voice/stt/", {
      method: "POST",
      credentials: "include",
      headers: csrfHeaders(),
      body: form
    })
    if (!res.ok) throw new Error(`stt HTTP ${res.status}`)
    const data = await res.json()
    return data.text || ""
  },

  async usage(studentId) {
    const res = await fetch(`/api/voice/usage/${studentId}/`, {
      credentials: "include"
    })
    if (!res.ok) throw new Error(`usage HTTP ${res.status}`)
    return res.json()
  }
}
