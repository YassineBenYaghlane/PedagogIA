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

export const voiceApi = {
  async tts(text, voice = "female") {
    const res = await fetch("/api/voice/tts/", {
      method: "POST",
      credentials: "include",
      headers: csrfHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ text, voice })
    })
    if (!res.ok) throw new Error(`tts HTTP ${res.status}`)
    return res.blob()
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
  }
}
