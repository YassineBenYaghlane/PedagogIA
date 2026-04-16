const TONES = {
  sage: "chip",
  sky: "chip chip-sky",
  honey: "chip chip-honey",
  bark: "chip chip-bark",
}

export default function Chip({ tone = "sage", className = "", children, ...rest }) {
  const base = TONES[tone] ?? TONES.sage
  return (
    <span className={`${base} ${className}`} {...rest}>
      {children}
    </span>
  )
}
