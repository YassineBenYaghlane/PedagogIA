import { useEffect, useRef, useState } from "react"
import Icon from "../ui/Icon"
import { voiceApi } from "../../api/voice"

function PlayButton({ text, voice }) {
  const [state, setState] = useState("idle") // idle | loading | playing
  const audioRef = useRef(null)
  const urlRef = useRef(null)

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current)
        urlRef.current = null
      }
    }
  }, [])

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setState("idle")
  }

  const play = async () => {
    if (state === "playing") {
      stop()
      return
    }
    if (state === "loading") return
    if (audioRef.current && urlRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play()
      setState("playing")
      return
    }
    try {
      setState("loading")
      const blob = await voiceApi.tts(text, voice)
      const url = URL.createObjectURL(blob)
      urlRef.current = url
      const audio = new Audio(url)
      audio.onended = () => setState("idle")
      audio.onpause = () => setState((s) => (s === "playing" ? "idle" : s))
      audioRef.current = audio
      await audio.play()
      setState("playing")
    } catch {
      setState("idle")
    }
  }

  const label = state === "playing" ? "Arrêter" : "Écouter"
  const iconName =
    state === "loading" ? "progress_activity" : state === "playing" ? "pause" : "volume_up"
  return (
    <button
      type="button"
      onClick={play}
      aria-label={label}
      data-testid="chat-play"
      className="mt-1.5 inline-flex items-center gap-1 text-xs text-sky-deep hover:text-bark transition-colors duration-200 cursor-pointer"
    >
      <Icon
        name={iconName}
        size={14}
        className={state === "loading" ? "animate-spin" : ""}
      />
      <span>{label}</span>
    </button>
  )
}

export default function ChatBubble({ role, children, streaming = false, voice, text, speech }) {
  const isStudent = role === "student"
  const containerCls = isStudent ? "flex flex-col items-end" : "flex flex-col items-start"
  const bubbleCls = isStudent
    ? "bg-sage-leaf/60 border border-sage/25 text-bark"
    : "bg-sky-soft/70 border border-sky/30 text-bark"
  const showPlay = !isStudent && !streaming && voice && (text || typeof children === "string")
  const speakable =
    speech || text || (typeof children === "string" ? children : null)
  return (
    <div className={containerCls}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${bubbleCls}`}
      >
        {children}
        {streaming && (
          <span className="inline-block ml-1 w-1.5 h-3.5 align-middle bg-sky-deep/60 animate-pulse rounded-sm" />
        )}
      </div>
      {showPlay && speakable && <PlayButton text={speakable} voice={voice} />}
    </div>
  )
}
