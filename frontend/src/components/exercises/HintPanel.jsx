import { useState } from "react"
import Icon from "../ui/Icon"
import { buildHint, hintLabels, nextHintLevel } from "../../lib/hints"

export default function HintPanel({ exercise }) {
  const [level, setLevel] = useState(null)

  const reveal = () => setLevel((cur) => nextHintLevel(cur))

  if (!exercise) return null
  const more = nextHintLevel(level) !== null

  return (
    <div className="mt-4 bg-secondary-container/20 rounded-xl p-4 text-left">
      {level && (
        <div className="mb-3">
          <p className="font-headline font-bold text-secondary mb-1 flex items-center gap-2">
            <Icon name="lightbulb" fill className="text-secondary" />
            {hintLabels[level]}
          </p>
          <p className="text-on-surface-variant">{buildHint(exercise, level)}</p>
        </div>
      )}
      {more && (
        <button
          onClick={reveal}
          className="bg-secondary-container/40 hover:bg-secondary-container/60 text-on-secondary-container font-headline font-bold w-full py-2 rounded-lg flex items-center justify-center gap-2 cursor-pointer"
        >
          <Icon name="lightbulb" />
          {level === null ? "Demander un indice" : "Indice suivant"}
        </button>
      )}
    </div>
  )
}
