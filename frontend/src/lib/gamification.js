export const RANKS = [
  { code: "curieux", label: "Curieux", threshold: 0 },
  { code: "calculateur", label: "Calculateur", threshold: 100 },
  { code: "arithmeticien", label: "Arithméticien", threshold: 300 },
  { code: "mathematicien", label: "Mathématicien", threshold: 700 },
  { code: "savant", label: "Savant", threshold: 1500 }
]

export const MATH_GLYPHS = {
  sigma: "Σ",
  sqrt: "√",
  pi: "π",
  infinity: "∞",
  delta: "∆",
  integral: "∫",
  plus_minus: "±",
  times: "×"
}

export const TIER_STYLES = {
  bronze: {
    ring: "ring-[#a97142]",
    from: "from-[#eec594]",
    to: "to-[#a97142]",
    text: "text-[#6b3f1f]"
  },
  argent: {
    ring: "ring-[#8a97a8]",
    from: "from-[#d8dde4]",
    to: "to-[#8a97a8]",
    text: "text-[#3c4654]"
  },
  or: {
    ring: "ring-[#c79a2a]",
    from: "from-[#ffe8a3]",
    to: "to-[#c79a2a]",
    text: "text-[#6c4a09]"
  }
}

export const rankInfo = (code) => RANKS.find((r) => r.code === code) || RANKS[0]

export const xpToNextRank = (xp) => {
  const idx = [...RANKS].reverse().findIndex((r) => xp >= r.threshold)
  const current = RANKS[RANKS.length - 1 - idx]
  const next = RANKS[RANKS.length - idx] || null
  if (!next) return { current, next: null, progress: 1, xpInTier: xp - current.threshold, tierSize: 0 }
  const tierSize = next.threshold - current.threshold
  const xpInTier = xp - current.threshold
  return { current, next, progress: xpInTier / tierSize, xpInTier, tierSize }
}

export const flameOpacity = (currentStreak) => {
  if (currentStreak <= 0) return 0.25
  if (currentStreak >= 10) return 1
  return 0.4 + (currentStreak / 10) * 0.6
}
