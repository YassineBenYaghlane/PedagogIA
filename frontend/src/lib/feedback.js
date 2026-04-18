import { useMemo } from "react"
import { playBadge, playCorrect, playIncorrect } from "../hooks/useSound"

const vibrate = (pattern) => {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return
  try {
    navigator.vibrate(pattern)
  } catch {
    // Some browsers throw on unsupported patterns — silent fallback.
  }
}

export const useFeedback = () =>
  useMemo(
    () => ({
      correct: () => {
        vibrate(15)
        playCorrect()
      },
      wrong: () => {
        vibrate([40, 60, 40])
        playIncorrect()
      },
      levelUp: () => {
        vibrate([10, 30, 10, 30, 60])
        playBadge()
      },
    }),
    [],
  )
