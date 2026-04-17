const GRADES = ["P6", "P5", "P4", "P3", "P2", "P1"]

export default function LevelGauge({ grade, difficulty }) {
  const rowIndex = GRADES.indexOf(grade)
  const validRow = rowIndex >= 0
  const diff = Math.min(Math.max(difficulty || 1, 1), 3)

  const rowHeightPct = 100 / GRADES.length
  const subPct = (diff - 1) * (rowHeightPct / 3) + rowHeightPct / 6
  const topPct = validRow
    ? rowIndex * rowHeightPct + rowHeightPct / 2 - rowHeightPct / 2 + subPct
    : 50

  return (
    <div className="flex flex-col items-center gap-2" data-testid="level-gauge">
      <div className="text-[10px] uppercase tracking-widest text-stem">Niveau</div>
      <div className="relative h-80 w-14 rounded-full bg-mist/70 border border-sage/20 overflow-hidden">
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-sage/15" />
        {GRADES.map((g, i) => {
          const isActive = g === grade
          return (
            <div
              key={g}
              className={`absolute left-0 right-0 flex items-center justify-center font-display text-xs ${
                isActive ? "text-sage-deep font-semibold" : "text-stem/70"
              }`}
              style={{
                top: `${i * rowHeightPct}%`,
                height: `${rowHeightPct}%`,
              }}
            >
              {g}
            </div>
          )
        })}
        <div
          className="absolute left-1 right-1 transition-all duration-700 ease-out"
          style={{
            top: `calc(${topPct}% - 14px)`,
            height: 28,
          }}
          aria-hidden
        >
          <div className="relative h-full w-full rounded-xl bg-sage-deep/90 shadow-lg shadow-sage/20 flex items-center justify-center">
            <div className="absolute inset-0 rounded-xl bg-sage-deep/20 blur-md" />
            <div className="relative flex items-center gap-0.5">
              {[1, 2, 3].map((d) => (
                <span
                  key={d}
                  className={`h-1 w-1 rounded-full ${
                    d <= diff ? "bg-bone" : "bg-bone/30"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="text-[10px] text-stem font-mono tabular-nums">
        {validRow ? `${grade} · d${diff}` : "—"}
      </div>
    </div>
  )
}
