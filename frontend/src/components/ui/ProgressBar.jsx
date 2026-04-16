const TONES = {
  sage: "bg-sage",
  sky: "bg-sky-deep",
  honey: "bg-honey",
  rose: "bg-rose",
}

const TRACKS = {
  sage: "bg-sage-pale/60",
  sky: "bg-sky-soft",
  honey: "bg-honey-soft",
  rose: "bg-rose-soft",
}

export default function ProgressBar({
  value = 0,
  max = 100,
  tone = "sage",
  gradient = false,
  className = "",
  showValue = false,
  label,
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  const fill = gradient
    ? "bg-gradient-to-r from-sage to-honey"
    : TONES[tone] ?? TONES.sage
  const track = TRACKS[tone] ?? TRACKS.sage

  return (
    <div className={className}>
      {(label || showValue) && (
        <div className="flex justify-between items-baseline mb-1 text-xs text-stem">
          {label ? <span>{label}</span> : <span />}
          {showValue && (
            <span className="font-mono text-bark tabular-nums">
              {value}
              {max !== 100 ? ` / ${max}` : "%"}
            </span>
          )}
        </div>
      )}
      <div className={`h-2 rounded-full overflow-hidden ${track}`}>
        <div
          className={`h-full ${fill} transition-[width] duration-300 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
