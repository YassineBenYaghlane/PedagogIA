import { MATH_GLYPHS, TIER_STYLES } from "../../lib/gamification"

export default function BadgeIcon({ icon = "sigma", tier = "bronze", size = 56, locked = false, title }) {
  const glyph = MATH_GLYPHS[icon] || MATH_GLYPHS.sigma
  const style = TIER_STYLES[tier] || TIER_STYLES.bronze
  const dim = typeof size === "number" ? `${size}px` : size
  return (
    <div
      title={title}
      className={`relative inline-flex items-center justify-center rounded-full ${locked ? "opacity-40 grayscale" : ""}`}
      style={{ width: dim, height: dim, background: style.halo, border: `1.5px solid ${style.stem}` }}
    >
      <svg
        viewBox="0 0 48 48"
        className="absolute inset-0 w-full h-full"
        aria-hidden="true"
      >
        <path
          d="M24 6C16 10 12 18 16 26"
          fill="none"
          stroke={style.stem}
          strokeWidth="1.3"
          strokeLinecap="round"
          opacity="0.55"
        />
        <path
          d="M24 42c8-4 12-12 8-20"
          fill="none"
          stroke={style.stem}
          strokeWidth="1.3"
          strokeLinecap="round"
          opacity="0.55"
        />
      </svg>
      <span
        className="relative font-mono font-semibold"
        style={{ color: style.ink, fontSize: `${parseInt(dim) * 0.48}px` }}
      >
        {glyph}
      </span>
    </div>
  )
}
