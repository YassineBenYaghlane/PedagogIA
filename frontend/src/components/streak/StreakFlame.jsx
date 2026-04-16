import { flameOpacity } from "../../lib/gamification"

export default function StreakFlame({ currentStreak = 0 }) {
  const op = flameOpacity(currentStreak)
  const active = currentStreak > 0
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 ${active ? "bg-honey-soft border border-honey/40" : "bg-mist border border-sage/15"}`}
      data-testid="streak-flame"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke={active ? "#8A6A1F" : "#A1AEA3"}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ opacity: op }}
        aria-hidden="true"
      >
        <path d="M12 2c4 5 6 8 6 12a6 6 0 0 1-12 0c0-4 2-7 6-12z" fill={active ? "#E8C66A" : "none"} />
      </svg>
      <span className="font-display font-semibold text-sm text-bark">
        {currentStreak} {currentStreak <= 1 ? "jour" : "jours"}
      </span>
    </div>
  )
}
