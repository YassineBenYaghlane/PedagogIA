import { useState } from "react"
import Icon from "../../ui/Icon"
import Button from "../../ui/Button"

export default function DecompositionInput({ exercise, disabled, onSubmit }) {
  const places = exercise?.params?.places ?? ["dizaines", "unités"]
  const [values, setValues] = useState(() =>
    Object.fromEntries(places.map((p) => [p, ""])),
  )

  const update = (place, v) => {
    const clean = v.replace(/[^0-9]/g, "").slice(0, 2)
    setValues((prev) => ({ ...prev, [place]: clean }))
  }

  const submit = (e) => {
    e.preventDefault()
    if (disabled) return
    const filled = Object.fromEntries(
      places.map((p) => [p, Number(values[p] || 0)]),
    )
    onSubmit(JSON.stringify(filled))
  }

  const allFilled = places.every((p) => values[p] !== "")

  return (
    <form onSubmit={submit} className="mt-4" data-testid="decomposition-input">
      <div className="flex flex-wrap items-center justify-center gap-2 text-bark">
        {places.map((place, idx) => (
          <span key={place} className="flex items-center gap-2">
            <input
              type="text"
              inputMode="numeric"
              value={values[place]}
              onChange={(e) => update(place, e.target.value)}
              disabled={disabled}
              autoFocus={idx === 0}
              className="w-16 text-center font-mono text-3xl font-semibold p-3 rounded-xl bg-paper text-bark border-2 border-sage/30 focus:border-sage focus:outline-none focus:ring-4 focus:ring-sage-pale/60 tabular-nums disabled:opacity-60"
              aria-label={place}
            />
            <span className="font-display text-lg text-stem">{place}</span>
            {idx < places.length - 1 && (
              <span className="font-mono text-2xl text-bark">+</span>
            )}
          </span>
        ))}
      </div>
      <Button
        type="submit"
        size="lg"
        disabled={disabled || !allFilled}
        className="w-full mt-5"
      >
        Valider <Icon name="check" />
      </Button>
    </form>
  )
}
