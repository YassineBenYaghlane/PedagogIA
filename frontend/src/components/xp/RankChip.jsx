import { rankInfo } from "../../lib/gamification"

const RANK_GLYPHS = {
  curieux: "?",
  calculateur: "±",
  arithmeticien: "×",
  mathematicien: "∫",
  savant: "∞"
}

export default function RankChip({ rank = "curieux" }) {
  const info = rankInfo(rank)
  return (
    <div className="inline-flex items-center gap-2 bg-surface-container-low rounded-full py-1 pl-2 pr-3 glass-card" data-testid="rank-chip">
      <span className="w-7 h-7 rounded-full gradient-soul text-on-primary flex items-center justify-center font-headline font-extrabold text-sm">
        {RANK_GLYPHS[rank] || "?"}
      </span>
      <span className="font-headline font-bold text-sm text-on-surface">{info.label}</span>
    </div>
  )
}
