import { useMemo } from "react"
import { GRADES, GRADE_COLORS } from "../../lib/skillTreeLayout"
import { levelDescriptions, levelLatin, levelVernacular } from "../../lib/constants"
import { SENTIER_LABEL, SENTIER_DOT } from "../../lib/skillStatus"

const STATE_LABEL = SENTIER_LABEL
const STATE_COLOR = SENTIER_DOT

const STATUS_TO_STATE = {
  completed: "done",
  in_progress: "in_progress",
  review: "wilted",
  locked: "locked",
}

function LockIcon({ className = "" }) {
  return (
    <svg
      className={className}
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  )
}

export default function SkillListView({
  nodes,
  gradeFilter,
  onSelect,
  selectedId,
  focusedId,
}) {
  const byGrade = useMemo(() => {
    const map = new Map(GRADES.map((g) => [g, []]))
    for (const n of nodes) {
      if (n.type !== "skillNode") continue
      const g = n.data.grade
      if (!map.has(g)) continue
      if (gradeFilter && g !== gradeFilter) continue
      map.get(g).push(n)
    }
    return map
  }, [nodes, gradeFilter])

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
      {GRADES.map((grade) => {
        const items = byGrade.get(grade) ?? []
        if (!items.length) return null
        const colors = GRADE_COLORS[grade]
        return (
          <section key={grade} aria-labelledby={`grade-${grade}`}>
            <header
              className="flex items-baseline gap-2 mb-2 pb-1.5 border-b"
              style={{ borderColor: `${colors.border}40` }}
            >
              <h2
                id={`grade-${grade}`}
                className="font-display font-semibold text-base"
                style={{ color: colors.text }}
              >
                {grade}
              </h2>
              <span className="latin text-[11px]">{levelLatin[grade]}</span>
              <span className="text-[11px] text-stem ml-auto">
                {levelDescriptions[grade]} · {levelVernacular[grade]}
              </span>
            </header>
            <ul className="space-y-1.5">
              {items.map((n) => {
                const d = n.data
                const state = STATUS_TO_STATE[d.status] ?? "locked"
                const pct = Math.round((d.masteryLevel ?? 0) * 100)
                const attempts = d.totalAttempts ?? 0
                const locked = !d.unlocked
                const isSelected = selectedId === d.id
                const isFocused = focusedId === d.id
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      data-skill-id={d.id}
                      data-focused={isFocused ? "true" : undefined}
                      aria-pressed={isSelected}
                      onClick={() => onSelect(d)}
                      className={`w-full flex items-center gap-3 text-left rounded-xl px-3 py-2.5 bg-paper border transition-colors ${isSelected ? "border-sage-deep" : isFocused ? "border-sage" : "border-sage/15"} ${locked ? "opacity-70" : ""}`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ background: STATE_COLOR[state] }}
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5 text-sm font-semibold text-bark leading-tight">
                          {locked && (
                            <LockIcon className="text-stem shrink-0" />
                          )}
                          <span className="truncate">{d.label}</span>
                        </span>
                        <span className="block latin text-[10px] mt-0.5">
                          {d.family} · {STATE_LABEL[state]}
                          {attempts > 0 ? ` · ${pct}%` : ""}
                        </span>
                      </span>
                      {attempts > 0 && (
                        <span className="font-mono text-xs text-sage-deep tabular-nums shrink-0">
                          {pct}%
                        </span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
