import Icon from "../ui/Icon"

const KEYS = ["7", "8", "9", "4", "5", "6", "1", "2", "3", "clear", "0", "submit"]

export default function NumberPad({ value, onChange, onSubmit, disabled }) {
  const press = (k) => {
    if (disabled) return
    if (k === "clear") return onChange("")
    if (k === "submit") return onSubmit()
    if (k === "back") return onChange(value.slice(0, -1))
    if (value.length >= 6) return
    onChange(value + k)
  }

  return (
    <div className="grid grid-cols-3 gap-3 mt-4" data-testid="number-pad">
      {KEYS.map((k) => {
        if (k === "clear") {
          return (
            <button
              key={k}
              type="button"
              onClick={() => press("back")}
              disabled={disabled}
              className="specimen bg-paper hover:bg-mist text-bark font-mono text-2xl py-5 rounded-xl cursor-pointer flex items-center justify-center transition-transform hover:-translate-y-0.5 disabled:opacity-50"
              aria-label="Effacer le dernier chiffre"
            >
              <Icon name="backspace" />
            </button>
          )
        }
        if (k === "submit") {
          return (
            <button
              key={k}
              type="button"
              onClick={() => press("submit")}
              disabled={disabled || !value.trim()}
              className="pill py-5 text-2xl rounded-xl cursor-pointer flex items-center justify-center disabled:opacity-50"
              aria-label="Valider"
            >
              <Icon name="check" />
            </button>
          )
        }
        return (
          <button
            key={k}
            type="button"
            onClick={() => press(k)}
            disabled={disabled}
            className="specimen bg-bone hover:bg-mist text-bark font-mono text-3xl font-semibold py-5 rounded-xl cursor-pointer transition-transform hover:-translate-y-0.5 disabled:opacity-50 tabular-nums"
          >
            {k}
          </button>
        )
      })}
    </div>
  )
}
