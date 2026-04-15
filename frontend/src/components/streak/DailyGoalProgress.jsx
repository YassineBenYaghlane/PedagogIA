import Icon from "../ui/Icon"

export default function DailyGoalProgress({ progress = 0, goal = 5 }) {
  const pct = Math.min(100, goal === 0 ? 0 : (progress / goal) * 100)
  const done = progress >= goal
  return (
    <div className="w-full" data-testid="daily-goal">
      <div className="flex justify-between text-xs font-headline font-bold text-on-surface-variant mb-1">
        <span className="flex items-center gap-1">
          <Icon name={done ? "check_circle" : "target"} className={done ? "text-tertiary" : ""} />
          Objectif du jour
        </span>
        <span>
          {progress} / {goal}
        </span>
      </div>
      <div className="h-2 rounded-full bg-surface-container-low overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${done ? "bg-tertiary" : "gradient-soul"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
