import { useCallback, useEffect, useRef, useState } from "react"
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs"
import pdfWorkerUrl from "pdfjs-dist/legacy/build/pdf.worker.mjs?url"
import Button from "../ui/Button"
import Icon from "../ui/Icon"
import Loader from "../ui/Loader"
import StyletCanvas, { ColorPicker } from "../ui/StyletCanvas"
import AtelierPdfPageJump from "./AtelierPdfPageJump"
import { DEFAULT_COLOR } from "../../lib/styletPalette"
import ChatPanel from "../chat/ChatPanel"
import { atelierPdfApi } from "../../api/atelierPdf"
import { useAuthStore } from "../../stores/authStore"
import { useChatStore } from "../../stores/chatStore"

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

const RENDER_SCALE = 1.5
const TOOL_DOT_BASE =
  "h-5 w-5 rounded-full flex items-center justify-center cursor-pointer transition-all border text-sage-deep disabled:opacity-30 disabled:cursor-not-allowed"
const TOOL_DOT_IDLE = "bg-bone border-sage/40 hover:border-sage hover:bg-sage-leaf/35 enabled:hover:scale-110"
const TOOL_DOT_ACTIVE = "bg-sage-leaf/65 border-sage-deep ring-2 ring-offset-1 ring-bark/40 scale-110"

export default function AtelierPdfReader({ source }) {
  const [doc, setDoc] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [pageRendered, setPageRendered] = useState(false)
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 })
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [feedbackError, setFeedbackError] = useState(null)
  const [chatError, setChatError] = useState(null)
  const [strokeColor, setStrokeColorRaw] = useState(DEFAULT_COLOR)
  const [eraseMode, setEraseMode] = useState(false)
  const [hasInk, setHasInk] = useState(false)
  const [canUndo, setCanUndo] = useState(false)
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false)
  const setStrokeColor = useCallback((c) => {
    setEraseMode(false)
    setStrokeColorRaw(c)
  }, [])
  const handleStyletState = useCallback((s) => {
    setHasInk(s.hasContent)
    setCanUndo(s.canUndo)
  }, [])
  const pdfCanvasRef = useRef(null)
  const styletRef = useRef(null)
  const renderTaskRef = useRef(null)
  const { selectedChildId, children } = useAuthStore()
  const child = children.find((c) => c.id === selectedChildId)
  const chat = useChatStore()
  const chatActive = !!chat.currentId
  const voice = child?.tutor_voice || "female"

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadError(null)
    setPageNumber(1)
    setDoc(null)
    pdfjsLib
      .getDocument({ url: source.url }).promise
      .then((d) => {
        if (cancelled) return
        setDoc(d)
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        setLoadError(err?.message || "Impossible de charger le PDF")
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [source.url])

  useEffect(() => {
    if (!doc) return
    let cancelled = false
    setPageRendered(false)
    setFeedbackError(null)
    setChatError(null)
    useChatStore.getState().selectConversation(null)
    styletRef.current?.reset?.()

    doc.getPage(pageNumber).then(async (page) => {
      if (cancelled) return
      const canvas = pdfCanvasRef.current
      if (!canvas) return
      if (renderTaskRef.current) {
        try { renderTaskRef.current.cancel() } catch { /* ignore */ }
      }
      const viewport = page.getViewport({ scale: RENDER_SCALE })
      const dpr = window.devicePixelRatio || 1
      const cssW = Math.floor(viewport.width)
      const cssH = Math.floor(viewport.height)
      canvas.width = Math.floor(viewport.width * dpr)
      canvas.height = Math.floor(viewport.height * dpr)
      canvas.style.width = `${cssW}px`
      canvas.style.height = `${cssH}px`
      setPageSize({ width: cssW, height: cssH })
      const ctx = canvas.getContext("2d")
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const transform = dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null
      const task = page.render({ canvasContext: ctx, viewport, transform })
      renderTaskRef.current = task
      try {
        await task.promise
        if (!cancelled) setPageRendered(true)
      } catch (err) {
        if (err?.name !== "RenderingCancelledException") {
          if (!cancelled) setLoadError(err?.message || "Erreur de rendu")
        }
      }
    })

    return () => {
      cancelled = true
    }
  }, [doc, pageNumber])

  const flattenPage = useCallback(async () => {
    const pdfCanvas = pdfCanvasRef.current
    if (!pdfCanvas) return null
    const styletBlob = (await styletRef.current?.exportBlob?.()) || null
    const out = document.createElement("canvas")
    out.width = pdfCanvas.width
    out.height = pdfCanvas.height
    const octx = out.getContext("2d")
    octx.drawImage(pdfCanvas, 0, 0)
    if (styletBlob) {
      const bitmap = await createImageBitmap(styletBlob)
      octx.drawImage(bitmap, 0, 0, out.width, out.height)
      bitmap.close?.()
    }
    return new Promise((resolve) => out.toBlob((b) => resolve(b), "image/png"))
  }, [])

  const openChatForFeedback = useCallback(
    async (feedbackText) => {
      if (!feedbackText || !selectedChildId) return
      const res = await atelierPdfApi.openChat({
        studentId: selectedChildId,
        feedback: feedbackText,
        docTitle: source.title,
        pageNumber
      })
      const store = useChatStore.getState()
      await store.loadConversations(selectedChildId)
      await store.selectConversation(res.conversation_id)
      setChatDrawerOpen(true)
    },
    [selectedChildId, source.title, pageNumber]
  )

  const submitPage = async () => {
    setFeedbackError(null)
    setChatError(null)
    setFeedbackLoading(true)
    useChatStore.getState().selectConversation(null)
    try {
      const blob = await flattenPage()
      if (!blob) throw new Error("Page non rendue")
      const file = new File([blob], "page.png", { type: "image/png" })
      const res = await atelierPdfApi.correctPage({
        image: file,
        docTitle: source.title,
        pageNumber
      })
      try {
        await openChatForFeedback(res.feedback)
      } catch (err) {
        setChatError(err?.data?.detail || err?.message || "Impossible d'ouvrir le chat")
      }
    } catch (err) {
      setFeedbackError(err?.data?.detail || err?.message || "Erreur de correction")
    } finally {
      setFeedbackLoading(false)
    }
  }

  const closeSidePanel = useCallback(() => {
    useChatStore.getState().selectConversation(null)
  }, [])

  const closeDrawer = useCallback(() => {
    setChatDrawerOpen(false)
  }, [])

  useEffect(() => {
    if (selectedChildId) {
      useChatStore.getState().loadConversations(selectedChildId)
    }
  }, [selectedChildId])

  const handleChatSend = useCallback(
    async (content, scratchImage = null) => {
      const store = useChatStore.getState()
      if (!store.currentId && selectedChildId) {
        const title = `${source.title} — page ${pageNumber}`.slice(0, 120)
        const conv = await store.createConversation(selectedChildId, title)
        if (!conv) return
      }
      await useChatStore.getState().send(content, scratchImage)
    },
    [selectedChildId, source.title, pageNumber]
  )

  const totalPages = doc?.numPages || 0
  const canPrev = pageNumber > 1 && !feedbackLoading
  const canNext = pageNumber < totalPages && !feedbackLoading

  const chatPanelProps = {
    title: "Avec le tuteur",
    messages: chat.messages,
    streamingText: chat.streamingText,
    sending: chat.sending,
    loading: chat.loadingConversation,
    error: chat.error,
    onSend: handleChatSend,
    emptyHint: "Corrige une page ou pose une question au tuteur.",
    voice,
    studentId: selectedChildId,
  }

  return (
    <div className="flex-1 flex flex-col px-4 sm:px-6 pt-3 pb-6 gap-3 w-full mx-auto max-w-[1600px]">
      {loading && (
        <div className="self-center">
          <Loader message="Chargement du sujet…" />
        </div>
      )}
      {loadError && (
        <div className="text-rose px-3 py-2 rounded-lg bg-rose-soft/60 max-w-xl w-full" role="alert">
          {loadError}
        </div>
      )}

      {doc && (
        <>
          <div className="sticky top-[64px] z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-2 bg-chalk/85 backdrop-blur border-b border-sage/10 grid grid-cols-[1fr_auto_1fr] items-center gap-3 w-[calc(100%+2rem)] sm:w-[calc(100%+3rem)]">
            <div className="flex items-center gap-3 justify-self-start">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                disabled={!canPrev}
                data-testid="pdf-prev"
              >
                <Icon name="arrow_back" /> Précédente
              </Button>
              <AtelierPdfPageJump
                pageNumber={pageNumber}
                totalPages={totalPages}
                onJump={setPageNumber}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPageNumber((p) => Math.min(totalPages, p + 1))}
                disabled={!canNext}
                data-testid="pdf-next"
              >
                Suivante <Icon name="arrow_forward" />
              </Button>
            </div>
            <div className="flex items-center gap-1.5 justify-self-center">
              <ColorPicker color={strokeColor} onSelect={setStrokeColor} />
              <span aria-hidden className="h-4 w-px bg-sage/25 mx-0.5" />
              <button
                type="button"
                onClick={() => setEraseMode((v) => !v)}
                data-testid="pdf-eraser"
                aria-label="Gomme"
                title="Gomme"
                aria-pressed={eraseMode}
                className={`${TOOL_DOT_BASE} ${eraseMode ? TOOL_DOT_ACTIVE : TOOL_DOT_IDLE}`}
              >
                <Icon name="eraser" size={14} />
              </button>
              <button
                type="button"
                onClick={() => styletRef.current?.undo?.()}
                disabled={!canUndo}
                data-testid="pdf-undo"
                aria-label="Annuler"
                title="Annuler"
                className={`${TOOL_DOT_BASE} ${TOOL_DOT_IDLE}`}
              >
                <Icon name="undo" size={14} />
              </button>
              <button
                type="button"
                onClick={() => styletRef.current?.clear?.()}
                disabled={!hasInk}
                data-testid="pdf-clear"
                aria-label="Tout effacer"
                title="Tout effacer"
                className={`${TOOL_DOT_BASE} ${TOOL_DOT_IDLE}`}
              >
                <Icon name="delete" size={14} />
              </button>
            </div>
            <div className="flex items-center gap-3 justify-self-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setChatDrawerOpen(true)}
                data-testid="pdf-open-tutor"
                className="xl:hidden relative"
                aria-label="Ouvrir le tuteur"
              >
                <Icon name="forum" />
                Tuteur
                {chatActive && (
                  <span
                    aria-hidden
                    className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-sage-deep shadow-[0_0_0_2px_var(--color-chalk)]"
                  />
                )}
              </Button>
              <Button
                onClick={submitPage}
                disabled={!pageRendered || feedbackLoading}
                data-testid="pdf-correct"
                size="sm"
                className="min-w-[180px] justify-center"
              >
                {feedbackLoading ? (
                  <>
                    <Icon name="progress_activity" className="animate-spin" /> Correction…
                  </>
                ) : (
                  <>
                    <Icon name="check_circle" /> Corriger cette page
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="flex flex-col xl:flex-row gap-4 w-full items-start">
            <div className="w-full xl:flex-1 xl:min-w-0 flex flex-col gap-4">
              <div className="overflow-x-auto -mx-4 sm:-mx-6 px-4 sm:px-6 pb-1">
                <div
                  className="relative rounded-2xl border border-sage/20 shadow-[var(--shadow-leaf)] bg-bone mx-auto"
                  style={{
                    ...(pageSize.width
                      ? { width: pageSize.width, height: pageSize.height }
                      : {}),
                    touchAction: "none",
                    WebkitUserSelect: "none",
                    userSelect: "none",
                    WebkitTouchCallout: "none",
                  }}
                  data-testid="pdf-page-frame"
                >
                  <canvas
                    ref={pdfCanvasRef}
                    data-testid="pdf-page-canvas"
                    className="block"
                  />
                  {pageRendered && (
                    <StyletCanvas
                      ref={styletRef}
                      background="transparent"
                      toolbar="minimal"
                      minHeight={0}
                      color={strokeColor}
                      onColorChange={setStrokeColor}
                      eraser={eraseMode}
                      onEraserChange={setEraseMode}
                      overlayActions={false}
                      onStateChange={handleStyletState}
                      data-testid="pdf-stylet-overlay"
                    />
                  )}
                </div>
              </div>

              {feedbackError && (
                <div className="text-rose px-3 py-2 rounded-lg bg-rose-soft/60 w-full" role="alert">
                  {feedbackError}
                </div>
              )}

              {chatError && (
                <div className="text-rose px-3 py-2 rounded-lg bg-rose-soft/60 w-full" role="alert">
                  {chatError}
                </div>
              )}
            </div>

            <aside
              className="hidden xl:block xl:w-[420px] xl:flex-shrink-0 xl:h-[calc(100dvh_-_160px)] xl:sticky xl:top-[140px] xl:self-start rounded-2xl overflow-hidden border border-sage/15 bg-bone shadow-[var(--shadow-leaf)]"
              data-testid="pdf-chat-pane"
            >
              <ChatPanel
                {...chatPanelProps}
                onClose={chatActive ? closeSidePanel : undefined}
              />
            </aside>
          </div>
        </>
      )}

      {chatDrawerOpen && (
        <div className="xl:hidden fixed inset-0 z-50" data-testid="pdf-chat-drawer">
          <button
            type="button"
            aria-label="Fermer le tuteur"
            onClick={closeDrawer}
            className="jardin-veil absolute inset-0 bg-bark/25 backdrop-blur-[2px] cursor-pointer"
          />
          <aside
            role="dialog"
            aria-label="Tuteur"
            className="jardin-drawer absolute top-0 right-0 bottom-0 w-full sm:w-[420px] bg-bone border-l border-sage/15 shadow-[0_30px_60px_-30px_rgba(43,58,46,0.45)] flex flex-col"
          >
            <ChatPanel
              {...chatPanelProps}
              onClose={closeDrawer}
            />
          </aside>
        </div>
      )}
    </div>
  )
}
