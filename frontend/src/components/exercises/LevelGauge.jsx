const GRADES = ["P1", "P2", "P3", "P4", "P5", "P6"]
const TOTAL_STEPS = GRADES.length * 3

export default function LevelGauge({ grade, difficulty, orientation = "vertical" }) {
  const gradeIdx = GRADES.indexOf(grade)
  const diff = Math.min(Math.max(difficulty || 1, 1), 3)
  const valid = gradeIdx >= 0

  const step = valid ? gradeIdx * 3 + diff : 0
  const fillPct = valid ? (step / TOTAL_STEPS) * 100 : 0
  const footer = valid ? `${grade} · d${diff}` : "—"

  if (orientation === "horizontal") {
    return (
      <div
        className="flex items-center gap-3 w-full"
        data-testid="level-gauge"
        data-orientation="horizontal"
      >
        <span className="text-[10px] uppercase tracking-widest text-stem shrink-0">
          Niveau
        </span>

        <div className="relative flex-1 h-2.5 rounded-full bg-mist overflow-hidden border border-sage/15">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-sage-leaf via-sage to-sage-deep transition-all duration-700 ease-out"
            style={{ width: `${fillPct}%` }}
          />
          {GRADES.slice(1).map((g, i) => (
            <div
              key={g}
              className="absolute top-0 bottom-0 w-px bg-sage/25"
              style={{ left: `${((i + 1) / GRADES.length) * 100}%` }}
            />
          ))}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-bone border-2 border-sage-deep shadow-md transition-all duration-700 ease-out"
            style={{ left: `calc(${fillPct}% - 7px)` }}
            aria-hidden
          />
        </div>

        <span className="text-[11px] text-bark font-mono tabular-nums shrink-0">
          {footer}
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-2" data-testid="level-gauge">
      <div className="text-[10px] uppercase tracking-widest text-stem">Niveau</div>

      <div className="flex items-stretch gap-2">
        <div className="relative w-2.5 h-72 rounded-full bg-mist overflow-hidden border border-sage/15">
          <div
            className="absolute left-0 right-0 bottom-0 bg-gradient-to-t from-sage-leaf via-sage to-sage-deep transition-all duration-700 ease-out"
            style={{ height: `${fillPct}%` }}
          />
          {GRADES.slice(1).map((g, i) => (
            <div
              key={g}
              className="absolute left-0 right-0 h-px bg-sage/20"
              style={{ bottom: `${((i + 1) / GRADES.length) * 100}%` }}
            />
          ))}
          <div
            className="absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-bone border-2 border-sage-deep shadow-md transition-all duration-700 ease-out"
            style={{ bottom: `calc(${fillPct}% - 8px)` }}
            aria-hidden
          />
        </div>

        <div className="relative flex flex-col justify-between h-72 py-0.5">
          {[...GRADES].reverse().map((g) => {
            const active = g === grade
            return (
              <div
                key={g}
                className={`font-display text-xs leading-none tabular-nums transition-colors duration-300 ${
                  active ? "text-sage-deep font-semibold" : "text-stem/60"
                }`}
              >
                {g}
              </div>
            )
          })}
        </div>
      </div>

      <div className="text-[10px] text-stem font-mono tabular-nums">{footer}</div>
    </div>
  )
}
