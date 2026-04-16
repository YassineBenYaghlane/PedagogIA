import { useState } from "react"
import Icon from "../../ui/Icon"
import NumberPad from "../NumberPad"

const NUMPAD_GRADES = new Set(["P1", "P2"])

export default function NumberInput({ grade, disabled, onSubmit }) {
  const [value, setValue] = useState("")
  const useNumPad = NUMPAD_GRADES.has(grade)

  const submit = () => {
    const v = value.trim()
    if (!v || disabled) return
    onSubmit(v)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    submit()
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
        autoFocus={!useNumPad}
        readOnly={useNumPad}
        placeholder={useNumPad ? "" : "Ta réponse..."}
        className="w-full text-center font-headline text-3xl font-bold p-4 rounded-xl bg-surface-container-low text-on-surface border border-transparent focus:bg-surface-container-lowest focus:border-primary/15 focus:shadow-[0_0_0_3px_rgba(0,89,182,0.1)] outline-none transition-all duration-300 disabled:opacity-60 placeholder:text-outline-variant"
        data-testid="exercise-input"
      />

      {useNumPad ? (
        <NumberPad value={value} onChange={setValue} onSubmit={submit} disabled={disabled} />
      ) : (
        <button
          type="submit"
          disabled={disabled}
          className="gradient-soul text-on-primary font-headline font-bold text-xl w-full mt-5 py-4 rounded-xl shadow-[0_12px_24px_rgba(0,89,182,0.3)] spring-hover cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
        >
          Valider <Icon name="check" />
        </button>
      )}
    </form>
  )
}
