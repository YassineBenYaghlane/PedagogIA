const UNSAFE = new Set(["POST", "PUT", "PATCH", "DELETE"])
const CSRF_COOKIE = import.meta.env.VITE_CSRF_COOKIE_NAME || "csrftoken"

function readCookie(name) {
  const match = document.cookie.match(new RegExp("(^|; )" + name + "=([^;]*)"))
  return match ? decodeURIComponent(match[2]) : null
}

async function request(path, { method = "GET", body, headers = {} } = {}) {
  const finalHeaders = { "Content-Type": "application/json", ...headers }
  const m = method.toUpperCase()
  if (UNSAFE.has(m)) {
    const token = readCookie(CSRF_COOKIE)
    if (token) finalHeaders["X-CSRFToken"] = token
  }
  const res = await fetch(`/api${path}`, {
    method: m,
    credentials: "include",
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined
  })
  if (res.status === 401) {
    window.dispatchEvent(new CustomEvent("auth:unauthorized"))
  }
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}`)
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}

export const api = {
  get: (p) => request(p),
  post: (p, body) => request(p, { method: "POST", body }),
  patch: (p, body) => request(p, { method: "PATCH", body }),
  put: (p, body) => request(p, { method: "PUT", body }),
  delete: (p) => request(p, { method: "DELETE" }),
  bootstrapCsrf: () => fetch("/api/csrf/", { credentials: "include" })
}
