export default function BinaryEqualityInput({ disabled, onSubmit }) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-3" data-testid="binary-equality-input">
      {["=", "≠"].map((sym) => (
        <button
          key={sym}
          type="button"
          onClick={() => onSubmit(sym)}
          disabled={disabled}
          data-value={sym}
          className="specimen min-h-16 py-4 bg-bone hover:bg-mist text-bark font-mono text-4xl font-semibold cursor-pointer transition-transform hover:-translate-y-0.5 disabled:opacity-50 tabular-nums"
        >
          {sym}
        </button>
      ))}
    </div>
  )
}
