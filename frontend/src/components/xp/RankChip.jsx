import { RANK_LATIN, rankInfo } from "../../lib/gamification"

const RANK_GLYPHS = {
  curieux: "?",
  calculateur: "±",
  arithmeticien: "×",
  mathematicien: "∫",
  savant: "∞",
}

export default function RankChip({ rank = "curieux" }) {
  const info = rankInfo(rank)
  return (
    <div
      className="inline-flex items-center gap-2 bg-paper border border-sage/20 rounded-full py-1 pl-1 pr-3"
      data-testid="rank-chip"
      title={RANK_LATIN[rank] || rank}
    >
      <span className="w-7 h-7 rounded-full bg-sage text-white flex items-center justify-center font-mono font-semibold text-sm">
        {RANK_GLYPHS[rank] || "?"}
      </span>
      <span className="font-display font-semibold text-sm text-bark">{info.label}</span>
    </div>
  )
}
