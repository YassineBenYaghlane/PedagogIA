const SYMBOLS = ["<", "=", ">"]

export default function SymbolInput({ disabled, onSubmit }) {
  return (
    <div className="mt-4 flex gap-3 justify-center" data-testid="symbol-input">
      {SYMBOLS.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onSubmit(s)}
          disabled={disabled}
          className="specimen w-24 h-24 bg-bone hover:bg-mist text-bark font-mono text-5xl font-semibold cursor-pointer transition-transform hover:-translate-y-0.5 disabled:opacity-50 tabular-nums"
        >
          {s}
        </button>
      ))}
    </div>
  )
}
