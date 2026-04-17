const GRADES = ["P1", "P2", "P3", "P4", "P5", "P6"]
const TOTAL_STEPS = GRADES.length * 3

export default function LevelGauge({ grade, difficulty }) {
  const gradeIdx = GRADES.indexOf(grade)
  const diff = Math.min(Math.max(difficulty || 1, 1), 3)
  const valid = gradeIdx >= 0

  const step = valid ? gradeIdx * 3 + diff : 0
  const fillPct = valid ? (step / TOTAL_STEPS) * 100 : 0

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

      <div className="text-[10px] text-stem font-mono tabular-nums">
        {valid ? `${grade} · d${diff}` : "—"}
      </div>
    </div>
  )
}
