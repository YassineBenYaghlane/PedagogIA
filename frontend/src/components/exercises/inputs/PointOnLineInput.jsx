import { useRef, useState } from "react"
import Icon from "../../ui/Icon"
import Button from "../../ui/Button"

const MARGIN = 40
const WIDTH = 600
const HEIGHT = 140

export default function PointOnLineInput({ exercise, disabled, onSubmit }) {
  const params = exercise?.params ?? {}
  const min = Number(params.min ?? 0)
  const max = Number(params.max ?? 10)
  const step = Number(params.step ?? 1)
  const [value, setValue] = useState(null)
  const [dragging, setDragging] = useState(false)
  const svgRef = useRef(null)

  const ticks = []
  for (let v = min; v <= max; v += step) ticks.push(v)

  const drawable = WIDTH - 2 * MARGIN
  const midRaw = (min + max) / 2
  const midSnapped = Math.round(midRaw / step) * step
  const labeledTicks = new Set([min, midSnapped, max])

  const toX = (v) => MARGIN + ((v - min) / (max - min)) * drawable

  const pickFromEvent = (clientX) => {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const ratio = (clientX - rect.left - (MARGIN / WIDTH) * rect.width) /
      ((drawable / WIDTH) * rect.width)
    const raw = min + Math.max(0, Math.min(1, ratio)) * (max - min)
    const snapped = Math.round(raw / step) * step
    setValue(Math.max(min, Math.min(max, snapped)))
  }

  const onPointerDown = (e) => {
    if (disabled) return
    svgRef.current?.setPointerCapture?.(e.pointerId)
    setDragging(true)
    pickFromEvent(e.clientX)
  }

  const onPointerMove = (e) => {
    if (!dragging || disabled) return
    pickFromEvent(e.clientX)
  }

  const onPointerUp = (e) => {
    svgRef.current?.releasePointerCapture?.(e.pointerId)
    setDragging(false)
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

  const lineY = HEIGHT / 2

  return (
    <div className="mt-4" data-testid="point-on-line-input">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full h-36 touch-none select-none cursor-pointer"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKey}
        tabIndex={disabled ? -1 : 0}
        role="slider"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value ?? min}
      >
        <line
          x1={MARGIN}
          x2={WIDTH - MARGIN}
          y1={lineY}
          y2={lineY}
          stroke="currentColor"
          strokeWidth="2"
          className="text-twig"
        />
        {ticks.map((t) => {
          const labeled = labeledTicks.has(t)
          return (
            <g key={t}>
              <line
                x1={toX(t)}
                x2={toX(t)}
                y1={lineY - (labeled ? 10 : 5)}
                y2={lineY + (labeled ? 10 : 5)}
                stroke="currentColor"
                strokeWidth={labeled ? 2 : 1}
                className="text-twig"
              />
              {labeled && (
                <text
                  x={toX(t)}
                  y={lineY + 30}
                  textAnchor="middle"
                  className="fill-stem font-mono"
                  style={{ fontSize: 14 }}
                >
                  {t}
                </text>
              )}
            </g>
          )
        })}
        {value !== null && (
          <circle cx={toX(value)} cy={lineY} r={14} className="fill-sage" />
        )}
      </svg>

      <Button
        size="lg"
        disabled={disabled || value === null}
        onClick={() => onSubmit(String(value))}
        className="w-full mt-4"
      >
        Valider <Icon name="check" />
      </Button>
    </div>
  )
}
