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
          className="w-full min-h-16 py-4 rounded-xl bg-surface-container-low text-on-surface font-headline text-2xl font-bold border border-outline-variant hover:bg-surface-container-lowest hover:border-primary/40 active:bg-primary/10 focus-visible:border-primary focus-visible:shadow-[0_0_0_3px_rgba(0,89,182,0.1)] outline-none transition-all duration-200 disabled:opacity-60 cursor-pointer touch-manipulation"
        >
          {opt}
        </button>
      ))}
    </div>
  )
}
