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
          className="w-20 h-20 rounded-xl bg-surface-container-low text-on-surface font-headline text-4xl font-extrabold border border-outline-variant hover:bg-surface-container-lowest hover:border-primary/40 focus:border-primary focus:shadow-[0_0_0_3px_rgba(0,89,182,0.1)] outline-none transition-all duration-200 disabled:opacity-60 cursor-pointer"
        >
          {s}
        </button>
      ))}
    </div>
  )
}
