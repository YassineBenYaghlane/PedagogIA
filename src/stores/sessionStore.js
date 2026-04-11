import { create } from "zustand"
import { OPERATIONS, opStartLevel } from "../lib/constants"
import { generators } from "../lib/generators"
import { getNextLevel, analyzeResults } from "../lib/adaptive"

const generateNextQuestion = (levels, questionIndex) => {
  const opIndex = questionIndex % OPERATIONS.length
  const op = OPERATIONS[opIndex]
  const level = levels[op]
  const gen = generators[op][level]
  if (!gen) {
    const available = Object.keys(generators[op])
    const fallbackGen = generators[op][available[available.length - 1]]
    const q = fallbackGen()
    return { ...q, operation: op, level: available[available.length - 1] }
  }
  const q = gen()
  return { ...q, operation: op, level }
}

export const useSessionStore = create((set, get) => ({
  questions: [],
  currentIndex: 0,
  results: [],
  currentLevels: { ...opStartLevel },
  analysis: null,

  startTest: () => {
    const initLevels = { ...opStartLevel }
    const firstQ = generateNextQuestion(initLevels, 0)
    set({
      currentLevels: initLevels,
      results: [],
      currentIndex: 0,
      questions: [firstQ],
      analysis: null
    })
  },

  handleAnswer: (isCorrect) => {
    const { questions, currentIndex, results, currentLevels } = get()
    const currentQ = questions[currentIndex]
    const newResult = { operation: currentQ.operation, level: currentQ.level, correct: isCorrect }
    const newResults = [...results, newResult]
    const nextIndex = currentIndex + 1

    if (nextIndex >= 20) {
      const analysis = analyzeResults(newResults)
      set({ results: newResults, analysis })
      return { finished: true }
    }

    const newLevels = { ...currentLevels }
    const op = currentQ.operation
    newLevels[op] = getNextLevel(currentLevels[op], isCorrect, op)

    const nextQ = generateNextQuestion(newLevels, nextIndex)
    set({
      results: newResults,
      currentLevels: newLevels,
      currentIndex: nextIndex,
      questions: [...questions, nextQ]
    })
    return { finished: false }
  },

  reset: () => {
    set({
      questions: [],
      currentIndex: 0,
      results: [],
      currentLevels: { ...opStartLevel },
      analysis: null
    })
  }
}))
