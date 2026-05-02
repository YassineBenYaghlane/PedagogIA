import { useRef, useState } from "react"
import Icon from "../ui/Icon"
import { voiceApi } from "../../api/voice"
import { TURN_STATES } from "../../lib/useConversationFlow"

const MAX_RECORDING_MS = 30_000

const TURN_HINT = {
  [TURN_STATES.BOT]: "Le tuteur parle…",
  [TURN_STATES.LISTENING]: "Parle, je t'écoute…",
  [TURN_STATES.TRANSCRIBING]: "J'écris ta phrase…"
}

export default function ChatComposer({
  onSend,
  disabled = false,
  placeholder,
  conversationMode = false,
  conversationTurn = TURN_STATES.IDLE,
  onToggleConversation
}) {
  const [value, setValue] = useState("")
  const [recording, setRecording] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [voiceError, setVoiceError] = useState(null)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const stopTimerRef = useRef(null)

  const submit = (e) => {
    e?.preventDefault()
    const trimmed = value.trim()
    if (!trimmed || disabled || conversationMode) return
    onSend(trimmed)
    setValue("")
  }
  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const startRecording = async () => {
    setVoiceError(null)
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setVoiceError("Micro indisponible sur ce navigateur")
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data)
      }
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" })
        chunksRef.current = []
        if (blob.size === 0) {
          setTranscribing(false)
          return
        }
        try {
          setTranscribing(true)
          const text = await voiceApi.stt(blob)
          if (text) setValue((v) => (v ? `${v} ${text}` : text))
        } catch {
          setVoiceError("Transcription impossible")
        } finally {
          setTranscribing(false)
        }
      }
      recorderRef.current = recorder
      recorder.start()
      setRecording(true)
      stopTimerRef.current = setTimeout(() => stopRecording(), MAX_RECORDING_MS)
    } catch {
      setVoiceError("Accès micro refusé")
    }
  }

  const stopRecording = () => {
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current)
      stopTimerRef.current = null
    }
    const recorder = recorderRef.current
    if (recorder && recorder.state !== "inactive") recorder.stop()
    setRecording(false)
  }

  const toggleMic = () => {
    if (recording) stopRecording()
    else startRecording()
  }

  const micBusy = transcribing
  const micActive = recording
  const micLabel = recording ? "Arrêter l'enregistrement" : "Parler"
  const liveTurnHint = conversationMode ? TURN_HINT[conversationTurn] : null
  const conversationActive = conversationMode

  return (
    <form onSubmit={submit} className="flex flex-col border-t border-sage/15 bg-bone">
      {conversationActive ? (
        <ConversationComposer
          turnHint={liveTurnHint || "Mode conversation"}
          onExit={onToggleConversation}
        />
      ) : (
        <div className="flex items-end gap-2 p-3">
          <button
            type="button"
            onClick={toggleMic}
            disabled={disabled || micBusy}
            aria-label={micLabel}
            aria-pressed={recording}
            data-testid="chat-mic"
            className={`flex items-center justify-center w-10 h-10 rounded-xl border transition-colors duration-200 ease-out cursor-pointer disabled:cursor-not-allowed ${
              micActive
                ? "bg-rose/20 border-rose/40 text-rose animate-pulse"
                : "bg-chalk border-sage/20 text-sage-deep hover:bg-sage-leaf/30"
            } ${micBusy ? "opacity-50" : ""}`}
          >
            <Icon
              name={micBusy ? "progress_activity" : "mic"}
              size={18}
              className={micBusy ? "animate-spin" : ""}
            />
          </button>
          <textarea
            rows={1}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKey}
            placeholder={
              recording ? "À l'écoute…" : transcribing ? "Transcription…" : placeholder || "Pose ta question…"
            }
            disabled={disabled}
            data-testid="chat-input"
            className="flex-1 resize-none rounded-xl border border-sage/20 bg-chalk px-3 py-2 text-sm text-bark placeholder:text-stem/60 focus:outline-none focus:border-sage-deep/50 transition-colors duration-200 ease-out max-h-40"
          />
          <button
            type="submit"
            disabled={disabled || !value.trim()}
            data-testid="chat-send"
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-sage-deep text-bone disabled:bg-sage/30 disabled:text-stem cursor-pointer transition-colors duration-200 ease-out hover:bg-sage-deep/90"
            aria-label="Envoyer"
          >
            <Icon name="send" size={18} />
          </button>
          {onToggleConversation && (
            <button
              type="button"
              onClick={onToggleConversation}
              disabled={disabled}
              aria-label="Mode conversation"
              data-testid="chat-conversation-toggle"
              className="flex items-center justify-center w-10 h-10 rounded-xl border border-sage/25 bg-chalk text-sage-deep hover:bg-sage-leaf/30 transition-colors duration-200 ease-out cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-deep/40"
            >
              <Icon name="audio_lines" size={18} />
            </button>
          )}
        </div>
      )}
      {voiceError && !conversationActive && (
        <p className="text-rose text-xs px-3 pb-2" data-testid="chat-voice-error">
          {voiceError}
        </p>
      )}
    </form>
  )
}

function ConversationComposer({ turnHint, onExit }) {
  return (
    <div className="flex items-center gap-3 px-3 py-3" data-testid="chat-conversation-composer">
      <span className="flex-1 text-sm text-stem">{turnHint}</span>
      <button
        type="button"
        onClick={onExit}
        aria-label="Quitter le mode conversation"
        data-testid="chat-conversation-exit"
        className="flex items-center justify-center w-10 h-10 rounded-xl bg-sage-deep text-bone hover:bg-sage-deep/90 transition-colors duration-200 ease-out cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-deep/40"
      >
        <Icon name="close" size={18} />
      </button>
    </div>
  )
}
