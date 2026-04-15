let ctx = null

const getCtx = () => {
  if (typeof window === "undefined") return null
  if (ctx) return ctx
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return null
  ctx = new AC()
  return ctx
}

const ensureRunning = (c) => {
  if (c.state === "suspended" && c.resume) c.resume().catch(() => {})
}

const tone = (freq, duration, type = "sine", gain = 0.2, startAt = 0) => {
  const c = getCtx()
  if (!c) return
  ensureRunning(c)
  const now = c.currentTime + startAt
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, now)
  g.gain.setValueAtTime(0, now)
  g.gain.linearRampToValueAtTime(gain, now + 0.015)
  g.gain.exponentialRampToValueAtTime(0.0001, now + duration)
  osc.connect(g)
  g.connect(c.destination)
  osc.start(now)
  osc.stop(now + duration + 0.05)
}

export const playCorrect = () => {
  tone(523.25, 0.18, "sine", 0.18, 0)
  tone(659.25, 0.18, "sine", 0.18, 0.08)
  tone(783.99, 0.26, "sine", 0.18, 0.16)
}

export const playIncorrect = () => {
  tone(220, 0.28, "square", 0.12, 0)
}

export const playBadge = () => {
  tone(880, 0.18, "triangle", 0.16, 0)
  tone(1318.51, 0.35, "triangle", 0.14, 0.1)
}

export const useSound = () => ({ playCorrect, playIncorrect, playBadge })
