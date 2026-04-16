import { useState } from "react"
import Icon from "../../ui/Icon"

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
      <div className="flex flex-wrap items-center justify-center gap-2 text-on-surface">
        {places.map((place, idx) => (
          <span key={place} className="flex items-center gap-2">
            <input
              type="text"
              inputMode="numeric"
              value={values[place]}
              onChange={(e) => update(place, e.target.value)}
              disabled={disabled}
              autoFocus={idx === 0}
              className="w-16 text-center font-headline text-3xl font-bold p-3 rounded-xl bg-surface-container-low border border-transparent focus:border-primary/30 focus:bg-surface-container-lowest outline-none disabled:opacity-60"
              aria-label={place}
            />
            <span className="font-headline text-lg">{place}</span>
            {idx < places.length - 1 && (
              <span className="font-headline text-2xl">+</span>
            )}
          </span>
        ))}
      </div>
      <button
        type="submit"
        disabled={disabled || !allFilled}
        className="gradient-soul text-on-primary font-headline font-bold text-xl w-full mt-5 py-4 rounded-xl shadow-[0_12px_24px_rgba(0,89,182,0.3)] spring-hover cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
      >
        Valider <Icon name="check" />
      </button>
    </form>
  )
}
