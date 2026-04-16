import BadgeIcon from "./BadgeIcon"

const ALL_BADGES = [
  { code: "first_step", label: "Premier pas", icon: "sigma", tier: "bronze" },
  { code: "ten_done", label: "Dix sur dix", icon: "sigma", tier: "bronze" },
  { code: "hundred_done", label: "La centaine", icon: "sigma", tier: "argent" },
  { code: "five_hundred_done", label: "Demi-millier", icon: "sigma", tier: "or" },
  { code: "first_correct", label: "Première solution", icon: "sqrt", tier: "bronze" },
  { code: "fifty_correct", label: "Cinquante solutions", icon: "sqrt", tier: "argent" },
  { code: "streak_3_row", label: "Trois d'affilée", icon: "delta", tier: "bronze" },
  { code: "streak_10_row", label: "Série parfaite", icon: "delta", tier: "or" },
  { code: "streak_day_3", label: "Trois jours", icon: "infinity", tier: "bronze" },
  { code: "streak_day_7", label: "Semaine entière", icon: "infinity", tier: "argent" },
  { code: "streak_day_30", label: "Mois mathématique", icon: "infinity", tier: "or" },
  { code: "skill_first_mastered", label: "Première compétence", icon: "pi", tier: "bronze" },
  { code: "skill_five_mastered", label: "Cinq compétences", icon: "pi", tier: "argent" },
  { code: "skill_grade_complete", label: "Année conquise", icon: "pi", tier: "or" },
  { code: "difficulty_3_correct", label: "Défi résolu", icon: "delta", tier: "argent" },
  { code: "rank_calculateur", label: "Rang Calculateur", icon: "plus_minus", tier: "bronze" },
  { code: "rank_arithmeticien", label: "Rang Arithméticien", icon: "times", tier: "argent" },
  { code: "rank_mathematicien", label: "Rang Mathématicien", icon: "integral", tier: "or" },
  { code: "rank_savant", label: "Rang Savant", icon: "infinity", tier: "or" },
  { code: "daily_goal_hit", label: "Objectif du jour", icon: "sigma", tier: "bronze" },
]

export default function BadgeGallery({ earned = [], compact = false }) {
  const earnedCodes = new Set(earned.map((b) => b.code))
  const earnedMap = new Map(earned.map((b) => [b.code, b]))
  const items = compact
    ? ALL_BADGES.filter((b) => earnedCodes.has(b.code)).slice(0, 8)
    : ALL_BADGES

  if (compact && items.length === 0) {
    return (
      <p className="text-sm text-stem text-center latin">
        Aucune fleur pressée — plante ta première graine.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-4 sm:grid-cols-5 gap-3" data-testid="badge-gallery">
      {items.map((b) => {
        const got = earnedMap.get(b.code) || b
        const locked = !earnedCodes.has(b.code)
        return (
          <div key={b.code} className="flex flex-col items-center gap-1.5">
            <BadgeIcon icon={got.icon} tier={got.tier} size={48} locked={locked} title={got.label} />
            {!compact && (
              <span className={`text-[10px] leading-tight text-center ${locked ? "text-twig" : "text-bark"}`}>
                {got.label}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
