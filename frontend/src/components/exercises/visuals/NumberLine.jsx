export default function NumberLine({ max = 20, highlight = [] }) {
  const ticks = Array.from({ length: max + 1 }, (_, i) => i)
  const marks = new Set(highlight)
  return (
    <div className="mt-4 overflow-x-auto" data-testid="number-line">
      <div className="inline-flex items-end gap-1 px-2 py-2 min-w-full">
        {ticks.map((n) => {
          const active = marks.has(n)
          return (
            <div key={n} className="flex flex-col items-center gap-1">
              <div
                className={`rounded-full ${active ? "bg-sage" : "bg-mist"}`}
                style={{ width: active ? 14 : 8, height: active ? 14 : 8 }}
              />
              <span className={`text-[10px] font-mono tabular-nums ${active ? "text-sage-deep font-semibold" : "text-stem"}`}>
                {n}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
