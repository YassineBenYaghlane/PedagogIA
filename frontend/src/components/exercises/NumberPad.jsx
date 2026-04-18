import Icon from "../ui/Icon"

const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"]
const MAX_LEN = 12

export default function NumberPad({ value, onChange, onSubmit, disabled }) {
  const press = (k) => {
    if (disabled) return
    if (k === "back") return onChange(value.slice(0, -1))
    if (k === "submit") return onSubmit()
    if (k === ",") {
      if (value.includes(",") || value.length >= MAX_LEN) return
      return onChange((value || "0") + ",")
    }
    if (value.length >= MAX_LEN) return
    onChange(value + k)
  }

  const digitClass =
    "specimen bg-bone hover:bg-mist active:bg-sage-leaf/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-deep text-bark font-mono text-3xl font-semibold py-5 min-h-[3.75rem] rounded-xl cursor-pointer transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 tabular-nums"
  const commaClass =
    "specimen bg-sky-soft hover:bg-sky/40 active:bg-sky/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-deep text-sky-deep font-mono text-3xl font-semibold py-5 min-h-[3.75rem] rounded-xl cursor-pointer transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 flex flex-col items-center justify-center leading-none"
  const utilClass =
    "specimen bg-paper hover:bg-mist active:bg-sage-leaf/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-deep text-bark font-mono text-2xl py-5 min-h-[3.75rem] min-w-11 rounded-xl cursor-pointer flex items-center justify-center transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0"

  return (
    <div className="grid grid-cols-3 gap-3 mt-3" data-testid="number-pad">
      {DIGITS.map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => press(k)}
          disabled={disabled}
          data-testid={`number-pad-key-${k}`}
          className={digitClass}
        >
          {k}
        </button>
      ))}
      <button
        type="button"
        onClick={() => press("back")}
        disabled={disabled}
        data-testid="number-pad-back"
        className={utilClass}
        aria-label="Effacer le dernier chiffre"
      >
        <Icon name="backspace" size={28} />
      </button>
      <button
        type="button"
        onClick={() => press("0")}
        disabled={disabled}
        data-testid="number-pad-key-0"
        className={digitClass}
      >
        0
      </button>
      <button
        type="button"
        onClick={() => press(",")}
        disabled={disabled || value.includes(",")}
        data-testid="number-pad-key-comma"
        className={commaClass}
        aria-label="Virgule décimale"
      >
        <span aria-hidden="true">,</span>
        <span className="text-[9px] uppercase tracking-widest font-sans font-semibold mt-1 opacity-80">
          virgule
        </span>
      </button>
      <button
        type="button"
        onClick={() => press("submit")}
        disabled={disabled || !value.trim()}
        data-testid="number-pad-submit"
        className="pill col-span-3 py-5 text-2xl rounded-xl cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
        aria-label="Valider"
      >
        Valider <Icon name="check" />
      </button>
    </div>
  )
}
