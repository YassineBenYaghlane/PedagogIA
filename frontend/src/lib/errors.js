import * as Sentry from "@sentry/react"

const dsnEnabled = Boolean(import.meta.env.VITE_SENTRY_DSN)

export function captureException(err, context) {
  if (!dsnEnabled) return
  Sentry.captureException(err, context ? { extra: context } : undefined)
}

export function isAuthError(err) {
  return err?.status === 401 || err?.status === 403
}

export function isClientError(err) {
  const s = err?.status
  return typeof s === "number" && s >= 400 && s < 500
}
