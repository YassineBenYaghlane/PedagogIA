export default function McqInput({ exercise, disabled, onSubmit }) {
  const options = exercise?.params?.options ?? []
  if (!options.length) return null

  return (
    <div className="mt-4 grid gap-3" data-testid="mcq-input">
      {options.map((opt, i) => (
        <button
          key={`${opt}-${i}`}
          type="button"
          onClick={() => onSubmit(String(opt))}
          disabled={disabled}
          className="specimen w-full min-h-16 py-4 bg-bone hover:bg-mist text-bark font-mono text-2xl font-semibold cursor-pointer transition-transform hover:-translate-y-0.5 disabled:opacity-50 tabular-nums"
        >
          {opt}
        </button>
      ))}
    </div>
  )
}
