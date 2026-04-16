import { useRef, useState } from "react"
import Icon from "../../ui/Icon"

const MARGIN = 32
const HEIGHT = 120

export default function PointOnLineInput({ exercise, disabled, onSubmit }) {
  const params = exercise?.params ?? {}
  const min = Number(params.min ?? 0)
  const max = Number(params.max ?? 10)
  const step = Number(params.step ?? 1)
  const [value, setValue] = useState(null)
  const svgRef = useRef(null)

  const ticks = []
  for (let v = min; v <= max; v += step) ticks.push(v)

  const toX = (v, width) => MARGIN + ((v - min) / (max - min)) * (width - 2 * MARGIN)

  const pickFromEvent = (clientX) => {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const ratio = (clientX - rect.left - MARGIN) / (rect.width - 2 * MARGIN)
    const raw = min + Math.max(0, Math.min(1, ratio)) * (max - min)
    const snapped = Math.round(raw / step) * step
    setValue(Math.max(min, Math.min(max, snapped)))
  }

  const onPointerDown = (e) => {
    if (disabled) return
    pickFromEvent(e.clientX)
  }

  const onPointerMove = (e) => {
    if (disabled || e.buttons !== 1) return
    pickFromEvent(e.clientX)
  }

  const onKey = (e) => {
    if (disabled) return
    const current = value ?? min
    if (e.key === "ArrowRight") {
      e.preventDefault()
      setValue(Math.min(max, current + step))
    } else if (e.key === "ArrowLeft") {
      e.preventDefault()
      setValue(Math.max(min, current - step))
    }
  }

  const width = 360
  const lineY = HEIGHT / 2

  return (
    <div className="mt-4" data-testid="point-on-line-input">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${HEIGHT}`}
        className="w-full h-32 touch-none select-none cursor-pointer"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onKeyDown={onKey}
        tabIndex={disabled ? -1 : 0}
        role="slider"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value ?? min}
      >
        <line
          x1={MARGIN}
          x2={width - MARGIN}
          y1={lineY}
          y2={lineY}
          stroke="currentColor"
          strokeWidth="2"
          className="text-outline"
        />
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={toX(t, width)}
              x2={toX(t, width)}
              y1={lineY - 8}
              y2={lineY + 8}
              stroke="currentColor"
              strokeWidth="2"
              className="text-outline"
            />
            <text
              x={toX(t, width)}
              y={lineY + 28}
              textAnchor="middle"
              className="fill-on-surface-variant text-xs"
            >
              {t}
            </text>
          </g>
        ))}
        {value !== null && (
          <circle
            cx={toX(value, width)}
            cy={lineY}
            r={12}
            className="fill-primary"
          />
        )}
      </svg>

      <div className="text-center mt-2 font-headline text-2xl text-on-surface">
        {value === null ? "Place le point" : value}
      </div>

      <button
        type="button"
        disabled={disabled || value === null}
        onClick={() => onSubmit(String(value))}
        className="gradient-soul text-on-primary font-headline font-bold text-xl w-full mt-4 py-4 rounded-xl shadow-[0_12px_24px_rgba(0,89,182,0.3)] spring-hover cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
      >
        Valider <Icon name="check" />
      </button>
    </div>
  )
}
