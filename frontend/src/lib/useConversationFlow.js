import { useCallback, useEffect, useRef, useState } from "react"
import { voiceApi, VoiceQuotaError } from "../api/voice"
import { startVoiceCapture } from "./vad"

const TURN_IDLE = "idle"
const TURN_BOT = "bot"
const TURN_LISTENING = "listening"
const TURN_TRANSCRIBING = "transcribing"

export const TURN_STATES = {
  IDLE: TURN_IDLE,
  BOT: TURN_BOT,
  LISTENING: TURN_LISTENING,
  TRANSCRIBING: TURN_TRANSCRIBING
}

export function useConversationFlow({
  enabled,
  voice,
  messages,
  streamingText,
  onSend,
  sending,
  studentId,
  onUsage,
  onQuotaExceeded
}) {
  const [turn, setTurn] = useState(TURN_IDLE)
  const audioContextRef = useRef(null)
  const currentSourceRef = useRef(null)
  const captureRef = useRef(null)
  const lastSpokenIdRef = useRef(null)
  const messagesRef = useRef(messages)
  const cancelledRef = useRef(false)

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  const ensureContext = useCallback(() => {
    if (!audioContextRef.current) {
      const Ctx = window.AudioContext || window.webkitAudioContext
      audioContextRef.current = new Ctx()
    }
    return audioContextRef.current
  }, [])

  const unlockAudio = useCallback(() => {
    const ctx = ensureContext()
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {})
    }
  }, [ensureContext])

  const stopSource = useCallback(() => {
    const source = currentSourceRef.current
    if (source) {
      try {
        source.onended = null
        source.stop()
        source.disconnect()
      } catch {
        // already stopped or not started
      }
      currentSourceRef.current = null
    }
  }, [])

  const stopMedia = useCallback(() => {
    stopSource()
    if (captureRef.current) {
      captureRef.current.stop()
      captureRef.current = null
    }
  }, [stopSource])

  const cancel = useCallback(() => {
    cancelledRef.current = true
    stopMedia()
    setTurn(TURN_IDLE)
  }, [stopMedia])

  const startListening = useCallback(async () => {
    if (cancelledRef.current || !enabled) return
    setTurn(TURN_LISTENING)
    captureRef.current = await startVoiceCapture({
      onResult: async (blob) => {
        captureRef.current = null
        if (cancelledRef.current) return
        if (!blob || blob.size === 0) {
          setTurn(TURN_IDLE)
          return
        }
        setTurn(TURN_TRANSCRIBING)
        try {
          const text = await voiceApi.stt(blob)
          if (cancelledRef.current) return
          setTurn(TURN_IDLE)
          if (text) onSend?.(text)
        } catch {
          setTurn(TURN_IDLE)
        }
      },
      onError: () => {
        captureRef.current = null
        setTurn(TURN_IDLE)
      }
    })
  }, [enabled, onSend])

  useEffect(() => {
    if (!enabled) {
      stopMedia()
      return undefined
    }
    cancelledRef.current = false
    const list = messagesRef.current
    const lastAssistant = [...list].reverse().find((m) => m.role === "assistant")
    lastSpokenIdRef.current = lastAssistant?.id ?? null
    const t = setTimeout(() => startListening(), 0)
    return () => {
      clearTimeout(t)
      stopMedia()
    }
  }, [enabled, stopMedia, startListening])

  useEffect(() => {
    if (!enabled || streamingText || sending) return
    const last = messages[messages.length - 1]
    if (!last || last.role !== "assistant") return
    if (lastSpokenIdRef.current === last.id) return
    lastSpokenIdRef.current = last.id

    let aborted = false
    const speakAndListen = async () => {
      setTurn(TURN_BOT)
      try {
        const ttsText = last.speech || last.content
        const { blob, used, cap } = await voiceApi.tts(
          ttsText,
          voice || "female",
          studentId
        )
        if (used && cap) onUsage?.({ used, cap })
        if (aborted || cancelledRef.current) return
        const ctx = ensureContext()
        if (ctx.state === "suspended") await ctx.resume()
        const arrayBuffer = await blob.arrayBuffer()
        if (aborted || cancelledRef.current) return
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer)
        if (aborted || cancelledRef.current) return
        stopSource()
        const source = ctx.createBufferSource()
        source.buffer = audioBuffer
        source.connect(ctx.destination)
        source.onended = () => {
          if (currentSourceRef.current === source) currentSourceRef.current = null
          if (cancelledRef.current || !enabled) {
            setTurn(TURN_IDLE)
            return
          }
          startListening()
        }
        currentSourceRef.current = source
        source.start()
      } catch (err) {
        if (err instanceof VoiceQuotaError) {
          onQuotaExceeded?.({ used: err.used, cap: err.cap })
        }
        setTurn(TURN_IDLE)
      }
    }
    speakAndListen()
    return () => {
      aborted = true
    }
  }, [
    enabled,
    messages,
    streamingText,
    sending,
    voice,
    studentId,
    onUsage,
    onQuotaExceeded,
    startListening,
    ensureContext,
    stopSource
  ])

  return { turn, cancel, unlockAudio }
}
