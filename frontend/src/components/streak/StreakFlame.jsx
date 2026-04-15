import { flameOpacity } from "../../lib/gamification"

export default function StreakFlame({ currentStreak = 0 }) {
  const op = flameOpacity(currentStreak)
  const active = currentStreak > 0
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 ${active ? "bg-secondary-container/40" : "bg-surface-container-low"}`}
      data-testid="streak-flame"
    >
      <span
        className={`material-symbols-outlined ${active ? "text-[#c08000]" : "text-on-surface-variant"}`}
        style={{ fontVariationSettings: "'FILL' 1", opacity: op, fontSize: "20px" }}
        aria-hidden="true"
      >
        local_fire_department
      </span>
      <span className="font-headline font-bold text-sm text-on-surface">
        {currentStreak} {currentStreak <= 1 ? "jour" : "jours"}
      </span>
    </div>
  )
}
