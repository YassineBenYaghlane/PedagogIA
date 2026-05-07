import { useCallback, useEffect, useRef, useState } from "react"
import * as pdfjsLib from "pdfjs-dist"
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url"
import Button from "../ui/Button"
import Icon from "../ui/Icon"
import Loader from "../ui/Loader"
import StyletCanvas, { ColorPicker } from "../ui/StyletCanvas"
import AtelierPdfPageJump from "./AtelierPdfPageJump"
import { DEFAULT_COLOR } from "../../lib/styletPalette"
import ChatPanel from "../chat/ChatPanel"
import { PlayButton } from "../chat/ChatBubble"
import { atelierPdfApi } from "../../api/atelierPdf"
import RichText from "../../lib/RichText"
import { useAuthStore } from "../../stores/authStore"
import { useChatStore } from "../../stores/chatStore"

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

const RENDER_SCALE = 1.5

export default function AtelierPdfReader({ source }) {
  const [doc, setDoc] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [pageRendered, setPageRendered] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [feedbackError, setFeedbackError] = useState(null)
  const [openingChat, setOpeningChat] = useState(false)
  const [chatError, setChatError] = useState(null)
  const [strokeColor, setStrokeColor] = useState(DEFAULT_COLOR)
  const pdfCanvasRef = useRef(null)
  const styletRef = useRef(null)
  const renderTaskRef = useRef(null)
  const { selectedChildId, children } = useAuthStore()
  const child = children.find((c) => c.id === selectedChildId)
  const chat = useChatStore()
  const chatOpen = !!chat.currentId
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
    setFeedback(null)
    setFeedbackError(null)
    setChatError(null)
    useChatStore.getState().selectConversation(null)
    styletRef.current?.clear?.()

    doc.getPage(pageNumber).then(async (page) => {
      if (cancelled) return
      const canvas = pdfCanvasRef.current
      if (!canvas) return
      if (renderTaskRef.current) {
        try { renderTaskRef.current.cancel() } catch { /* ignore */ }
      }
      const viewport = page.getViewport({ scale: RENDER_SCALE })
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.floor(viewport.width * dpr)
      canvas.height = Math.floor(viewport.height * dpr)
      canvas.style.width = `${Math.floor(viewport.width)}px`
      canvas.style.height = `${Math.floor(viewport.height)}px`
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
      const text = feedbackText ?? feedback
      if (!text || !selectedChildId) return
      setChatError(null)
      setOpeningChat(true)
      try {
        const res = await atelierPdfApi.openChat({
          studentId: selectedChildId,
          feedback: text,
          docTitle: source.title,
          pageNumber
        })
        const store = useChatStore.getState()
        await store.loadConversations(selectedChildId)
        await store.selectConversation(res.conversation_id)
      } catch (err) {
        setChatError(err?.data?.detail || err?.message || "Impossible d'ouvrir le chat")
      } finally {
        setOpeningChat(false)
      }
    },
    [feedback, selectedChildId, source.title, pageNumber]
  )

  const submitPage = async () => {
    setFeedbackError(null)
    setFeedbackLoading(true)
    setFeedback(null)
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
      setFeedback(res.feedback)
      const isWide =
        typeof window !== "undefined" &&
        window.matchMedia("(min-width: 1024px)").matches
      if (isWide) {
        await openChatForFeedback(res.feedback)
      }
    } catch (err) {
      setFeedbackError(err?.data?.detail || err?.message || "Erreur de correction")
    } finally {
      setFeedbackLoading(false)
    }
  }

  const closeChat = useCallback(() => {
    useChatStore.getState().selectConversation(null)
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

  return (
    <div className="flex-1 flex flex-col px-4 sm:px-6 pt-3 pb-6 gap-3 w-full mx-auto max-w-5xl lg:max-w-[1400px]">
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
          <div className="sticky top-[64px] z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-2 bg-chalk/85 backdrop-blur border-b border-sage/10 flex flex-wrap items-center justify-between gap-3 w-[calc(100%+2rem)] sm:w-[calc(100%+3rem)]">
            <div className="flex items-center gap-3">
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
            <ColorPicker color={strokeColor} onSelect={setStrokeColor} />
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

          <div className="flex flex-col lg:flex-row gap-4 w-full items-start">
            <div className="w-full lg:flex-1 lg:min-w-0 flex flex-col items-center gap-4">
              <div className="relative inline-block max-w-full overflow-auto rounded-2xl border border-sage/20 shadow-inner bg-bone">
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
                    data-testid="pdf-stylet-overlay"
                  />
                )}
              </div>

              {feedbackError && (
              <div className="text-rose px-3 py-2 rounded-lg bg-rose-soft/60 w-full" role="alert">
                {feedbackError}
              </div>
            )}

            {feedback && !feedbackLoading && !chatOpen && (
              <div
                className="bg-sky-soft/60 border border-sky/30 rounded-2xl px-4 py-3 w-full text-bark"
                data-testid="pdf-feedback"
              >
                <RichText className="rich-text text-sm leading-relaxed" html={feedback} />
                <div className="flex items-center gap-4 mt-2 -mb-1">
                  {selectedChildId && (
                    <PlayButton
                      text={feedback}
                      voice={voice}
                      studentId={selectedChildId}
                    />
                  )}
                  <button
                    type="button"
                    onClick={openChatForFeedback}
                    disabled={openingChat || !selectedChildId}
                    data-testid="pdf-open-chat"
                    className="mt-1.5 inline-flex items-center gap-1 text-xs text-sky-deep hover:text-bark transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Icon
                      name={openingChat ? "progress_activity" : "forum"}
                      size={14}
                      className={openingChat ? "animate-spin" : ""}
                    />
                    <span>{openingChat ? "Ouverture…" : "En discuter avec le tuteur"}</span>
                  </button>
                </div>
              </div>
            )}

            {chatError && (
              <div className="text-rose px-3 py-2 rounded-lg bg-rose-soft/60 w-full" role="alert">
                {chatError}
              </div>
            )}
          </div>

          <div
            className={`w-full h-[480px] sm:h-[560px] rounded-2xl overflow-hidden lg:w-[420px] lg:flex-shrink-0 lg:h-[calc(100dvh_-_160px)] lg:sticky lg:top-[140px] lg:self-start ${
              chatOpen ? "block" : "hidden"
            } lg:block`}
            data-testid="pdf-chat-pane"
          >
            <ChatPanel
              title="Avec le tuteur"
              onClose={chatOpen ? closeChat : undefined}
              messages={chat.messages}
              streamingText={chat.streamingText}
              sending={chat.sending}
              loading={chat.loadingConversation}
              error={chat.error}
              onSend={handleChatSend}
              emptyHint={
                feedback
                  ? "Pose une question sur la correction."
                  : "Corrige une page ou pose une question au tuteur."
              }
              voice={voice}
              studentId={selectedChildId}
            />
          </div>
          </div>
        </>
      )}
    </div>
  )
}
