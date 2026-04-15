import { xpToNextRank } from "../../lib/gamification"

export default function XPBar({ xp = 0 }) {
  const { current, next, progress, xpInTier, tierSize } = xpToNextRank(xp)
  const pct = Math.min(100, Math.max(0, progress * 100))
  return (
    <div className="w-full" data-testid="xp-bar">
      <div className="flex justify-between text-xs font-headline font-bold text-on-surface-variant mb-1">
        <span>{xp} XP</span>
        {next ? (
          <span>
            {xpInTier} / {tierSize} → {next.label}
          </span>
        ) : (
          <span>Rang max : {current.label}</span>
        )}
      </div>
      <div className="h-2 rounded-full bg-surface-container-low overflow-hidden">
        <div
          className="h-full gradient-soul transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
