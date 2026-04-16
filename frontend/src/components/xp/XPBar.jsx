import { xpToNextRank } from "../../lib/gamification"

export default function XPBar({ xp = 0 }) {
  const { current, next, progress, xpInTier, tierSize } = xpToNextRank(xp)
  const pct = Math.min(100, Math.max(0, progress * 100))
  return (
    <div className="w-full" data-testid="xp-bar">
      <div className="flex justify-between text-xs font-mono text-stem mb-1 tabular-nums">
        <span>{xp} XP</span>
        {next ? (
          <span>
            {xpInTier} / {tierSize} → {next.label}
          </span>
        ) : (
          <span>Rang max · {current.label}</span>
        )}
      </div>
      <div className="h-2 rounded-full bg-sage-pale/60 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-sage to-honey transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
