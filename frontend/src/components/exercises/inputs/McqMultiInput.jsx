import { useState } from "react"
import Button from "../../ui/Button"

export default function McqMultiInput({ exercise, disabled, onSubmit }) {
  const options = exercise?.params?.options ?? []
  const [picked, setPicked] = useState(() => new Set())
  if (!options.length) return null

  const toggle = (opt) => {
    if (disabled) return
    setPicked((prev) => {
      const next = new Set(prev)
      const key = String(opt)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const handleSubmit = () => {
    if (disabled || picked.size === 0) return
    onSubmit(JSON.stringify([...picked]))
  }

  return (
    <div className="mt-4 grid gap-3" data-testid="mcq-multi-input">
      {options.map((opt, i) => {
        const key = String(opt)
        const isOn = picked.has(key)
        return (
          <button
            key={`${opt}-${i}`}
            type="button"
            onClick={() => toggle(opt)}
            disabled={disabled}
            aria-pressed={isOn}
            data-value={opt}
            className={
              "specimen w-full min-h-16 py-4 text-bark font-mono text-xl sm:text-2xl font-semibold cursor-pointer transition-transform hover:-translate-y-0.5 disabled:opacity-50 tabular-nums " +
              (isOn ? "bg-sage-leaf ring-2 ring-sage" : "bg-bone hover:bg-mist")
            }
          >
            {opt}
          </button>
        )
      })}
      <Button
        type="button"
        onClick={handleSubmit}
        disabled={disabled || picked.size === 0}
        className="mt-2 w-full"
        data-testid="mcq-multi-submit"
      >
        Valider
      </Button>
    </div>
  )
}
