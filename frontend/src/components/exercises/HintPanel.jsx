import { useState } from "react"
import Icon from "../ui/Icon"
import Button from "../ui/Button"
import { buildHint, hintLabels, nextHintLevel } from "../../lib/hints"

export default function HintPanel({ exercise }) {
  const [level, setLevel] = useState(null)
  const reveal = () => setLevel((cur) => nextHintLevel(cur))
  if (!exercise) return null
  const more = nextHintLevel(level) !== null

  return (
    <div className="mt-4 rounded-xl p-4 text-left bg-sky-soft/60 border border-sky/30">
      {level && (
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="chip chip-sky">{hintLabels[level]}</span>
            <span className="latin text-[11px]">Suggestio</span>
          </div>
          <p className="text-sm text-bark">{buildHint(exercise, level)}</p>
        </div>
      )}
      {more && (
        <Button variant="ghost" size="sm" onClick={reveal} className="w-full">
          <Icon name="lightbulb" />
          {level === null ? "Demander un indice" : "Indice suivant"}
        </Button>
      )}
    </div>
  )
}
