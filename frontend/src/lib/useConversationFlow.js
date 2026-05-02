import { useCallback, useEffect, useRef, useState } from "react"
import { voiceApi } from "../api/voice"
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

export function useConversationFlow({ enabled, voice, messages, streamingText, onSend, sending }) {
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
    const last = messages[messages.length - 1]
    console.log("[conv-flow] tick", {
      enabled,
      sending,
      streamingLen: streamingText?.length || 0,
      turn,
      lastRole: last?.role,
      lastId: last?.id,
      lastSpoken: lastSpokenIdRef.current
    })
    if (!enabled || streamingText || sending) return
    if (!last || last.role !== "assistant") return
    if (lastSpokenIdRef.current === last.id) return
    if (turn !== TURN_IDLE) return
    lastSpokenIdRef.current = last.id

    let aborted = false
    const speakAndListen = async () => {
      console.log("[conv-flow] speakAndListen → fetching tts", { len: last.content.length, voice })
      setTurn(TURN_BOT)
      try {
        const blob = await voiceApi.tts(last.content, voice || "female")
        console.log("[conv-flow] tts blob received", { size: blob.size, type: blob.type })
        if (aborted || cancelledRef.current) return
        const ctx = ensureContext()
        if (ctx.state === "suspended") {
          console.log("[conv-flow] resuming suspended audio context")
          await ctx.resume()
        }
        console.log("[conv-flow] context state", ctx.state)
        const arrayBuffer = await blob.arrayBuffer()
        if (aborted || cancelledRef.current) return
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer)
        console.log("[conv-flow] decoded buffer", { duration: audioBuffer.duration })
        if (aborted || cancelledRef.current) return
        stopSource()
        const source = ctx.createBufferSource()
        source.buffer = audioBuffer
        source.connect(ctx.destination)
        source.onended = () => {
          console.log("[conv-flow] playback ended")
          if (currentSourceRef.current === source) currentSourceRef.current = null
          if (cancelledRef.current || !enabled) {
            setTurn(TURN_IDLE)
            return
          }
          startListening()
        }
        currentSourceRef.current = source
        source.start()
        console.log("[conv-flow] source.start() called")
      } catch (err) {
        console.error("[conv-flow] speakAndListen failed", err)
        setTurn(TURN_IDLE)
      }
    }
    speakAndListen()
    return () => {
      aborted = true
    }
  }, [enabled, messages, streamingText, sending, voice, turn, startListening, ensureContext, stopSource])

  return { turn, cancel, unlockAudio }
}
