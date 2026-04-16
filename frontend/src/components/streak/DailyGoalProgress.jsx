import Icon from "../ui/Icon"
import ProgressBar from "../ui/ProgressBar"

export default function DailyGoalProgress({ progress = 0, goal = 5 }) {
  const done = progress >= goal
  return (
    <div className="w-full" data-testid="daily-goal">
      <div className="flex justify-between text-xs font-semibold text-stem mb-1">
        <span className="flex items-center gap-1.5">
          <Icon name={done ? "check_circle" : "target"} size={14} className={done ? "text-sage-deep" : "text-stem"} />
          Objectif du jour
        </span>
        <span className="font-mono tabular-nums text-bark">
          {progress} / {goal}
        </span>
      </div>
      <ProgressBar value={progress} max={goal} tone={done ? "honey" : "sage"} />
    </div>
  )
}
