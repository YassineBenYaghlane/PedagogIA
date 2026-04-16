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
  bronze: { halo: "#C7E0B5", ink: "#3F6F4A", stem: "#6FA274" },
  argent: { halo: "#DCEDF4", ink: "#2F6A88", stem: "#4F8BAC" },
  or: { halo: "#FBF1D6", ink: "#8A6A1F", stem: "#E8C66A" },
}

export const RANK_LATIN = {
  curieux: "Curiosus",
  calculateur: "Calculator",
  arithmeticien: "Arithmeticus",
  mathematicien: "Mathematicus",
  savant: "Sapiens",
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
