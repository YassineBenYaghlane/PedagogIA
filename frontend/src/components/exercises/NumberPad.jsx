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
    <div className="grid grid-cols-3 gap-3 mt-3" data-testid="number-pad">
      {KEYS.map((k) => {
        if (k === "clear") {
          return (
            <button
              key={k}
              type="button"
              onClick={() => press("back")}
              disabled={disabled}
              className="bg-surface-container-low hover:bg-surface-container text-on-surface font-headline font-bold text-2xl py-5 rounded-xl cursor-pointer spring-hover flex items-center justify-center disabled:opacity-50"
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
              className="gradient-soul text-on-primary font-headline font-bold text-2xl py-5 rounded-xl cursor-pointer spring-hover flex items-center justify-center disabled:opacity-50"
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
            className="bg-surface-container-low hover:bg-surface-container text-on-surface font-headline font-extrabold text-3xl py-5 rounded-xl cursor-pointer spring-hover disabled:opacity-50"
          >
            {k}
          </button>
        )
      })}
    </div>
  )
}
