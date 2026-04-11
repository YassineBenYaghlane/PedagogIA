import { OPERATIONS, LEVELS } from "./constants"
import { generators } from "./generators"

export const getNextLevel = (currentLevel, correct, op) => {
  const available = Object.keys(generators[op])
  const idx = available.indexOf(currentLevel)
  if (correct && idx < available.length - 1) return available[idx + 1]
  if (!correct && idx > 0) return available[idx - 1]
  return currentLevel
}

export const analyzeResults = (results) => {
  const byOp = {}
  for (const op of OPERATIONS) {
    byOp[op] = results.filter((r) => r.operation === op)
  }

  const opAnalysis = {}
  for (const op of OPERATIONS) {
    const opResults = byOp[op]
    if (opResults.length === 0) {
      opAnalysis[op] = { maxLevel: null, score: 0, total: 0, details: [] }
      continue
    }

    const byLevel = {}
    for (const r of opResults) {
      if (!byLevel[r.level]) byLevel[r.level] = []
      byLevel[r.level].push(r.correct)
    }

    let maxLevel = null
    const availableLevels = Object.keys(generators[op])
    for (const lvl of availableLevels) {
      if (byLevel[lvl] && byLevel[lvl].some((c) => c)) {
        maxLevel = lvl
      }
    }

    const correct = opResults.filter((r) => r.correct).length

    opAnalysis[op] = {
      maxLevel,
      score: correct,
      total: opResults.length,
      details: byLevel
    }
  }

  const levels = OPERATIONS.map((op) => opAnalysis[op].maxLevel).filter(Boolean)
  const levelIndices = levels.map((l) => LEVELS.indexOf(l))
  const avgIndex = levelIndices.length > 0 ? Math.round(levelIndices.reduce((a, b) => a + b, 0) / levelIndices.length) : 0
  const estimatedLevel = LEVELS[avgIndex]

  const strengths = []
  const weaknesses = []
  for (const op of OPERATIONS) {
    const a = opAnalysis[op]
    if (a.total === 0) continue
    const ratio = a.score / a.total
    if (ratio >= 0.7) {
      strengths.push(op)
    } else {
      weaknesses.push(op)
    }
  }

  return { opAnalysis, estimatedLevel, strengths, weaknesses, totalCorrect: results.filter((r) => r.correct).length, totalQuestions: results.length }
}
