import { useCallback, useEffect, useImperativeHandle, useRef, useState, forwardRef } from "react"
import Button from "./Button"
import Icon from "./Icon"
import { PALETTE, DEFAULT_COLOR } from "../../lib/styletPalette"

const STROKE_BASE_WIDTH = 2.5
const STROKE_PRESSURE_GAIN = 4

const BACKGROUNDS = {
  paper: "#f6f8f3",
  transparent: null,
}

function getCtx(canvas) {
  return canvas?.getContext("2d", { willReadFrequently: false }) || null
}

function fitToContainer(canvas, container) {
  const dpr = window.devicePixelRatio || 1
  const rect = container.getBoundingClientRect()
  const cssW = Math.max(1, Math.floor(rect.width))
  const cssH = Math.max(1, Math.floor(rect.height))
  canvas.width = Math.floor(cssW * dpr)
  canvas.height = Math.floor(cssH * dpr)
  canvas.style.width = `${cssW}px`
  canvas.style.height = `${cssH}px`
  const ctx = getCtx(canvas)
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  return { dpr, cssW, cssH }
}

function paintBackground(ctx, w, h, background) {
  const fill = BACKGROUNDS[background]
  if (!fill) {
    ctx.clearRect(0, 0, w, h)
    return
  }
  ctx.fillStyle = fill
  ctx.fillRect(0, 0, w, h)
}

function strokeWidthFor(pressure) {
  const p = typeof pressure === "number" && pressure > 0 ? pressure : 0.5
  return STROKE_BASE_WIDTH + p * STROKE_PRESSURE_GAIN
}

const StyletCanvas = forwardRef(function StyletCanvas(
  {
    onCommit,
    onCancel,
    background = "paper",
    title = "Brouillon stylet",
    commitLabel = "Joindre",
    cancelLabel = "Annuler",
    minHeight = 320,
    toolbar = "full",
    color: controlledColor,
    onColorChange,
    "data-testid": dataTestid,
  },
  ref,
) {
  const showHeader = toolbar === "full"
  const showActions = toolbar === "full"
  const showOverlayClear = toolbar === "minimal"
  const overlayMode = toolbar === "minimal" && background === "transparent"
  const colorIsControlled = controlledColor !== undefined
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const strokesRef = useRef([])
  const currentRef = useRef(null)
  const activePenRef = useRef(null)
  const sizeRef = useRef({ cssW: 0, cssH: 0 })
  const [hasContent, setHasContent] = useState(false)
  const [internalColor, setInternalColor] = useState(DEFAULT_COLOR)
  const color = colorIsControlled ? controlledColor : internalColor
  const setColor = onColorChange || setInternalColor

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = getCtx(canvas)
    if (!canvas || !ctx) return
    const { cssW, cssH } = sizeRef.current
    paintBackground(ctx, cssW, cssH, background)
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    for (const stroke of strokesRef.current) {
      drawStroke(ctx, stroke)
    }
    if (currentRef.current) drawStroke(ctx, currentRef.current)
  }, [background])

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const apply = () => {
      const { cssW, cssH } = fitToContainer(canvas, container)
      sizeRef.current = { cssW, cssH }
      redraw()
    }
    apply()
    const ro = new ResizeObserver(apply)
    ro.observe(container)
    return () => ro.disconnect()
  }, [redraw])

  const localPoint = (event) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      pressure: event.pressure,
      type: event.pointerType,
    }
  }

  const onPointerDown = (event) => {
    const t = event.pointerType
    if (t === "touch" && activePenRef.current !== null) return
    if (t === "pen") activePenRef.current = event.pointerId
    canvasRef.current.setPointerCapture?.(event.pointerId)
    event.preventDefault()
    currentRef.current = { color, points: [localPoint(event)] }
    redraw()
  }
  const onPointerMove = (event) => {
    const stroke = currentRef.current
    if (!stroke) return
    if (event.pointerType === "touch" && activePenRef.current !== null) return
    const events = event.getCoalescedEvents?.() || [event]
    for (const e of events) stroke.points.push(localPoint(e))
    redraw()
  }
  const finishStroke = (event) => {
    const stroke = currentRef.current
    currentRef.current = null
    if (event.pointerType === "pen" && activePenRef.current === event.pointerId) {
      activePenRef.current = null
    }
    if (stroke && stroke.points.length > 0) {
      strokesRef.current.push(stroke)
      setHasContent(true)
    }
    redraw()
  }
  const onPointerUp = (event) => finishStroke(event)
  const onPointerCancel = (event) => finishStroke(event)
  const onPointerLeave = (event) => {
    if (currentRef.current) finishStroke(event)
  }

  const clear = useCallback(() => {
    strokesRef.current = []
    currentRef.current = null
    setHasContent(false)
    redraw()
  }, [redraw])

  const exportBlob = useCallback(
    () =>
      new Promise((resolve) => {
        const canvas = canvasRef.current
        if (!canvas || !hasContent) {
          resolve(null)
          return
        }
        canvas.toBlob((blob) => resolve(blob), "image/png")
      }),
    [hasContent],
  )

  useImperativeHandle(ref, () => ({ clear, exportBlob, hasContent: () => hasContent }), [
    clear, exportBlob, hasContent,
  ])

  const commit = async () => {
    const blob = await exportBlob()
    if (blob) onCommit?.(blob)
  }

  return (
    <div
      data-testid={dataTestid}
      className={
        overlayMode
          ? "absolute inset-0"
          : "flex flex-col gap-3 w-full h-full"
      }
    >
      {showHeader && title && (
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-display text-sm text-bark">{title}</h3>
          <div className="flex items-center gap-3">
            <ColorPicker color={color} onSelect={setColor} />
            <button
              type="button"
              onClick={clear}
              disabled={!hasContent}
              data-testid="stylet-clear"
              className="inline-flex items-center gap-1 text-xs text-stem hover:text-bark transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Icon name="refresh" size={14} />
              Effacer
            </button>
          </div>
        </div>
      )}
      <div
        ref={containerRef}
        className={
          overlayMode
            ? "absolute inset-0 overflow-hidden"
            : `relative flex-1 overflow-hidden ${
                background === "transparent"
                  ? ""
                  : "rounded-2xl border border-sage/20 bg-chalk shadow-inner"
              }`
        }
        style={{ minHeight, touchAction: "none" }}
      >
        <canvas
          ref={canvasRef}
          data-testid="stylet-canvas"
          className="block w-full h-full"
          style={{
            background: "transparent",
            touchAction: "none",
            WebkitUserSelect: "none",
            userSelect: "none",
            WebkitTouchCallout: "none",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onPointerLeave={onPointerLeave}
        />
        {showOverlayClear && !colorIsControlled && (
          <div
            className="absolute top-2 left-2 bg-bone/80 backdrop-blur-sm rounded-lg border border-sage/15 px-2 py-1"
            style={{ touchAction: "auto" }}
          >
            <ColorPicker color={color} onSelect={setColor} />
          </div>
        )}
        {showOverlayClear && hasContent && (
          <button
            type="button"
            onClick={clear}
            data-testid="stylet-clear"
            className="absolute top-2 right-2 inline-flex items-center gap-1 text-xs text-stem hover:text-bark bg-bone/80 backdrop-blur-sm px-2 py-1 rounded-lg border border-sage/15 transition-colors cursor-pointer"
          >
            <Icon name="refresh" size={12} />
            Effacer
          </button>
        )}
      </div>
      {showActions && (onCommit || onCancel) && (
        <div className="flex gap-2 justify-end">
          {onCancel && (
            <Button variant="ghost" onClick={onCancel} data-testid="stylet-cancel">
              {cancelLabel}
            </Button>
          )}
          {onCommit && (
            <Button onClick={commit} disabled={!hasContent} data-testid="stylet-commit">
              {commitLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  )
})

function drawStroke(ctx, stroke) {
  if (!stroke || !stroke.points || stroke.points.length === 0) return
  ctx.strokeStyle = stroke.color
  ctx.fillStyle = stroke.color
  const points = stroke.points
  if (points.length === 1) {
    const p = points[0]
    ctx.beginPath()
    ctx.arc(p.x, p.y, strokeWidthFor(p.pressure) / 2, 0, Math.PI * 2)
    ctx.fill()
    return
  }
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]
    const b = points[i]
    ctx.lineWidth = strokeWidthFor((a.pressure + b.pressure) / 2)
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
  }
}

export function ColorPicker({ color, onSelect, className = "" }) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`} data-testid="stylet-colors">
      {PALETTE.map((c) => {
        const active = c.value === color
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect(c.value)}
            data-testid={`stylet-color-${c.id}`}
            aria-label={c.label}
            aria-pressed={active}
            className={`h-5 w-5 rounded-full transition-transform cursor-pointer ${
              active ? "ring-2 ring-offset-1 ring-bark/40 scale-110" : "hover:scale-110"
            }`}
            style={{ backgroundColor: c.swatch || c.value }}
          />
        )
      })}
    </div>
  )
}

export default StyletCanvas
