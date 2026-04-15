import { MATH_GLYPHS, TIER_STYLES } from "../../lib/gamification"

export default function BadgeIcon({ icon = "sigma", tier = "bronze", size = 56, locked = false, title }) {
  const glyph = MATH_GLYPHS[icon] || MATH_GLYPHS.sigma
  const style = TIER_STYLES[tier] || TIER_STYLES.bronze
  const dim = typeof size === "number" ? `${size}px` : size
  return (
    <div
      title={title}
      className={`inline-flex items-center justify-center rounded-full bg-gradient-to-br ${style.from} ${style.to} ring-2 ring-offset-1 ring-offset-surface-container-lowest ${style.ring} shadow-ambient ${locked ? "opacity-35 grayscale" : ""}`}
      style={{ width: dim, height: dim }}
    >
      <span className={`font-headline font-extrabold ${style.text}`} style={{ fontSize: `${parseInt(dim) * 0.55}px` }}>
        {glyph}
      </span>
    </div>
  )
}
