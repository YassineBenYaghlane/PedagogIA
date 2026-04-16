import { useEffect, useRef, useState } from "react"
import NumberPad from "../NumberPad"

const MAX_LEN = 8

export default function NumberInput({ disabled, onSubmit }) {
  const [value, setValue] = useState("")
  const valueRef = useRef(value)

  useEffect(() => {
    valueRef.current = value
  }, [value])

  const submit = () => {
    const v = valueRef.current.trim()
    if (!v || disabled) return
    onSubmit(v)
  }

  useEffect(() => {
    const onKey = (e) => {
      if (disabled) return
      if (e.key >= "0" && e.key <= "9") {
        setValue((prev) => (prev.length >= MAX_LEN ? prev : prev + e.key))
      } else if (e.key === "," || e.key === ".") {
        setValue((prev) => {
          if (prev.includes(",") || prev.length >= MAX_LEN) return prev
          return (prev || "0") + ","
        })
      } else if (e.key === "Backspace") {
        setValue((prev) => prev.slice(0, -1))
      } else if (e.key === "Enter") {
        e.preventDefault()
        const v = valueRef.current.trim()
        if (v) onSubmit(v)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [disabled, onSubmit])

  return (
    <div className="mt-4" data-testid="number-input">
      <div
        className="w-full text-center font-headline text-5xl font-extrabold p-4 rounded-xl bg-surface-container-low text-on-surface min-h-[5rem] flex items-center justify-center tabular-nums"
        aria-live="polite"
        data-testid="exercise-input"
      >
        {value || <span className="text-outline-variant text-3xl">—</span>}
      </div>
      <NumberPad value={value} onChange={setValue} onSubmit={submit} disabled={disabled} />
    </div>
  )
}
