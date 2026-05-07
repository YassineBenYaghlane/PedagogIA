export const MIC_ERROR_CODES = {
  PERMISSION_DENIED: "permission_denied",
  NOT_FOUND: "not_found",
  IN_USE: "in_use",
  UNSUPPORTED: "unsupported",
  INSECURE_CONTEXT: "insecure_context",
  IN_APP_BROWSER: "in_app_browser",
  UNKNOWN: "unknown"
}

const IN_APP_PATTERNS = [
  /Instagram/i,
  /FBAN|FBAV/,
  /LinkedInApp/i,
  /Line\//,
  /Twitter/i,
  /Snapchat/i,
  /MicroMessenger/i,
  /TikTok|Musical_ly|BytedanceWebview/i
]

export function detectInAppBrowser(ua = navigator.userAgent || "") {
  return IN_APP_PATTERNS.some((re) => re.test(ua))
}

export function detectBrowserFamily(ua = navigator.userAgent || "") {
  const isIOS =
    /iP(hone|ad|od)/.test(ua) ||
    (/Macintosh/.test(ua) && typeof navigator !== "undefined" && navigator.maxTouchPoints > 1)
  const isAndroid = /Android/.test(ua)
  const isFirefox = /Firefox|FxiOS/.test(ua)
  const isEdge = /Edg/.test(ua)
  const isChrome = /Chrome|CriOS/.test(ua) && !isEdge
  const isSafari = /Safari/.test(ua) && !isChrome && !isFirefox && !isEdge

  if (isIOS) return "ios"
  if (isAndroid) return isFirefox ? "android_firefox" : "android_chrome"
  if (isFirefox) return "firefox"
  if (isSafari) return "safari"
  if (isEdge) return "edge"
  if (isChrome) return "chrome"
  return "other"
}

export function classifyMicError(err) {
  if (typeof window !== "undefined" && window.isSecureContext === false) {
    return MIC_ERROR_CODES.INSECURE_CONTEXT
  }
  if (detectInAppBrowser()) return MIC_ERROR_CODES.IN_APP_BROWSER
  if (
    typeof navigator === "undefined" ||
    !navigator.mediaDevices?.getUserMedia ||
    typeof MediaRecorder === "undefined"
  ) {
    return MIC_ERROR_CODES.UNSUPPORTED
  }
  const name = err?.name
  if (name === "NotAllowedError" || name === "SecurityError") {
    return MIC_ERROR_CODES.PERMISSION_DENIED
  }
  if (name === "NotFoundError" || name === "OverconstrainedError") {
    return MIC_ERROR_CODES.NOT_FOUND
  }
  if (name === "NotReadableError" || name === "TrackStartError") {
    return MIC_ERROR_CODES.IN_USE
  }
  return MIC_ERROR_CODES.UNKNOWN
}

export async function getMicPermissionState() {
  if (typeof navigator === "undefined" || !navigator.permissions?.query) return "unknown"
  try {
    const status = await navigator.permissions.query({ name: "microphone" })
    return status.state
  } catch {
    return "unknown"
  }
}

export async function requestMicrophone(constraints = { audio: true }) {
  if (typeof window !== "undefined" && window.isSecureContext === false) {
    return { ok: false, code: MIC_ERROR_CODES.INSECURE_CONTEXT }
  }
  if (detectInAppBrowser()) {
    return { ok: false, code: MIC_ERROR_CODES.IN_APP_BROWSER }
  }
  if (
    typeof navigator === "undefined" ||
    !navigator.mediaDevices?.getUserMedia ||
    typeof MediaRecorder === "undefined"
  ) {
    return { ok: false, code: MIC_ERROR_CODES.UNSUPPORTED }
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints)
    return { ok: true, stream }
  } catch (err) {
    return { ok: false, code: classifyMicError(err), error: err }
  }
}
