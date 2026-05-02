import { useEffect, useRef, useState } from "react"
import ChatBubble from "./ChatBubble"
import ChatComposer from "./ChatComposer"
import TurnIndicator from "./TurnIndicator"
import Loader from "../ui/Loader"
import Icon from "../ui/Icon"
import { useConversationFlow, TURN_STATES } from "../../lib/useConversationFlow"

function PaneHeader({ title, onClose, extra }) {
  if (!title && !onClose && !extra) return null
  return (
    <header className="flex items-center justify-between px-4 py-2.5 border-b border-sage/15 bg-mist/50">
      <div className="flex items-center gap-2 text-sage-deep">
        {title && <Icon name="forum" size={16} />}
        {title && <span className="font-display text-sm">{title}</span>}
      </div>
      <div className="flex items-center gap-2">
        {extra}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le chat"
            data-testid="chat-close"
            className="w-8 h-8 -mr-1 rounded-lg flex items-center justify-center text-stem hover:text-bark hover:bg-sage-leaf/30 transition-colors duration-200 cursor-pointer"
          >
            <Icon name="close" size={18} />
          </button>
        )}
      </div>
    </header>
  )
}

function ExerciceActions({ onRetry, onNext }) {
  if (!onRetry && !onNext) return null
  return (
    <div className="flex gap-2 px-3 py-2 border-b border-sage/15 bg-mist/40">
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          data-testid="chat-retry"
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold bg-sage-leaf/60 text-sage-deep hover:bg-sage-leaf/80 transition-colors duration-200 cursor-pointer"
        >
          <Icon name="refresh" size={14} />
          Réessayer
        </button>
      )}
      {onNext && (
        <button
          type="button"
          onClick={onNext}
          data-testid="chat-next"
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold bg-sage-deep text-bone hover:bg-sage-deep/90 transition-colors duration-200 cursor-pointer"
        >
          Suivant
          <Icon name="arrow_forward" size={14} />
        </button>
      )}
    </div>
  )
}

export default function ChatPanel({
  messages,
  streamingText,
  sending,
  loading,
  error,
  onSend,
  onRetry,
  onNext,
  title,
  onClose,
  readOnly = false,
  emptyHint,
  voice,
  headerExtra
}) {
  const scrollerRef = useRef(null)
  const [conversationMode, setConversationMode] = useState(false)

  const { turn, cancel } = useConversationFlow({
    enabled: conversationMode && !readOnly,
    voice,
    messages,
    streamingText,
    sending,
    onSend
  })

  useEffect(() => {
    const el = scrollerRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, streamingText, turn])

  const handleToggleConversation = () => {
    if (conversationMode) {
      cancel()
      setConversationMode(false)
    } else {
      setConversationMode(true)
    }
  }

  return (
    <div className="flex flex-col h-full bg-chalk rounded-2xl border border-sage/15 shadow-sm overflow-hidden">
      <PaneHeader title={title} onClose={onClose} extra={headerExtra} />
      <ExerciceActions onRetry={onRetry} onNext={onNext} />
      {loading ? (
        <div className="flex-1 flex items-center justify-center py-10">
          <Loader message="Chargement…" />
        </div>
      ) : (
        <div
          ref={scrollerRef}
          className="flex-1 overflow-y-auto p-4 space-y-3"
          data-testid="chat-scroller"
        >
          {messages.length === 0 && !streamingText && (
            <p className="text-center text-sm text-stem py-6">
              {emptyHint || "Pose ta première question."}
            </p>
          )}
          {messages.map((m) => (
            <ChatBubble
              key={m.id}
              role={m.role}
              voice={conversationMode ? undefined : voice}
              text={m.content}
            >
              {m.content}
            </ChatBubble>
          ))}
          {streamingText && (
            <ChatBubble role="assistant" streaming>
              {streamingText}
            </ChatBubble>
          )}
          {error && (
            <p className="text-rose text-xs text-center" data-testid="chat-error">
              {error}
            </p>
          )}
        </div>
      )}
      {conversationMode && (
        <TurnIndicator
          turn={turn}
          onCancel={() => {
            cancel()
            setConversationMode(false)
          }}
        />
      )}
      {!readOnly && (
        <ChatComposer
          onSend={onSend}
          disabled={sending}
          conversationMode={conversationMode}
          conversationTurn={turn}
          onToggleConversation={handleToggleConversation}
          placeholder={
            sending ? "Le tuteur réfléchit…" : "Pose ta question…"
          }
        />
      )}
    </div>
  )
}

export { TURN_STATES }
