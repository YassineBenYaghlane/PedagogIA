import { useCallback, useEffect, useImperativeHandle, useRef, useState, forwardRef } from "react"
import Button from "./Button"
import Icon from "./Icon"

const STROKE_COLOR = "#2b3a2e"
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
  },
  ref,
) {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const strokesRef = useRef([])
  const currentRef = useRef(null)
  const activePenRef = useRef(null)
  const sizeRef = useRef({ cssW: 0, cssH: 0 })
  const [hasContent, setHasContent] = useState(false)

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = getCtx(canvas)
    if (!canvas || !ctx) return
    const { cssW, cssH } = sizeRef.current
    paintBackground(ctx, cssW, cssH, background)
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.strokeStyle = STROKE_COLOR
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
    currentRef.current = [localPoint(event)]
    redraw()
  }
  const onPointerMove = (event) => {
    const stroke = currentRef.current
    if (!stroke) return
    if (event.pointerType === "touch" && activePenRef.current !== null) return
    const events = event.getCoalescedEvents?.() || [event]
    for (const e of events) stroke.push(localPoint(e))
    redraw()
  }
  const finishStroke = (event) => {
    const stroke = currentRef.current
    currentRef.current = null
    if (event.pointerType === "pen" && activePenRef.current === event.pointerId) {
      activePenRef.current = null
    }
    if (stroke && stroke.length > 0) {
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
    <div className="flex flex-col gap-3 w-full h-full">
      {title && (
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm text-bark">{title}</h3>
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
      )}
      <div
        ref={containerRef}
        className="flex-1 rounded-2xl border border-sage/20 overflow-hidden bg-chalk shadow-inner"
        style={{ minHeight, touchAction: "none" }}
      >
        <canvas
          ref={canvasRef}
          data-testid="stylet-canvas"
          className="block w-full h-full"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onPointerLeave={onPointerLeave}
        />
      </div>
      {(onCommit || onCancel) && (
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
  if (!stroke || stroke.length === 0) return
  if (stroke.length === 1) {
    const p = stroke[0]
    ctx.beginPath()
    ctx.fillStyle = STROKE_COLOR
    ctx.arc(p.x, p.y, strokeWidthFor(p.pressure) / 2, 0, Math.PI * 2)
    ctx.fill()
    return
  }
  for (let i = 1; i < stroke.length; i++) {
    const a = stroke[i - 1]
    const b = stroke[i]
    ctx.lineWidth = strokeWidthFor((a.pressure + b.pressure) / 2)
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
  }
}

export default StyletCanvas
