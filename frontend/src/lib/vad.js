const SPEECH_RMS = 0.025
const MIN_SPEECH_MS = 350
const SILENCE_MS = 1200
const NO_SPEECH_TIMEOUT_MS = 8000
const HARD_CAP_MS = 30000

export async function startVoiceCapture({ onLevel, onResult, onError } = {}) {
  let stream
  let ctx
  let analyser
  let recorder
  const chunks = []
  let stopped = false
  let firstSpeechAt = 0
  let lastSpeechAt = 0
  const startedAt = performance.now()

  const cleanup = () => {
    stopped = true
    try {
      if (recorder && recorder.state !== "inactive") recorder.stop()
    } catch {
      // ignore
    }
    if (stream) stream.getTracks().forEach((t) => t.stop())
    if (ctx && ctx.state !== "closed") ctx.close().catch(() => {})
  }

  const finish = (blob) => {
    if (recorder && recorder.state !== "inactive") {
      const handle = () => {
        cleanup()
        onResult?.(blob ?? new Blob(chunks, { type: recorder.mimeType || "audio/webm" }))
      }
      recorder.onstop = handle
      recorder.stop()
      return
    }
    cleanup()
    onResult?.(blob ?? new Blob(chunks, { type: "audio/webm" }))
  }

  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    ctx = new (window.AudioContext || window.webkitAudioContext)()
    const source = ctx.createMediaStreamSource(stream)
    analyser = ctx.createAnalyser()
    analyser.fftSize = 1024
    source.connect(analyser)

    recorder = new MediaRecorder(stream)
    recorder.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) chunks.push(ev.data)
    }
    recorder.start()

    const buf = new Float32Array(analyser.fftSize)
    const tick = () => {
      if (stopped) return
      analyser.getFloatTimeDomainData(buf)
      let sum = 0
      for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i]
      const rms = Math.sqrt(sum / buf.length)
      const now = performance.now()
      onLevel?.(rms)
      if (rms > SPEECH_RMS) {
        lastSpeechAt = now
        if (!firstSpeechAt) firstSpeechAt = now
      }
      const elapsed = now - startedAt
      if (elapsed > HARD_CAP_MS) return finish()
      if (!firstSpeechAt && elapsed > NO_SPEECH_TIMEOUT_MS) return finish(null)
      if (
        firstSpeechAt &&
        now - firstSpeechAt > MIN_SPEECH_MS &&
        now - lastSpeechAt > SILENCE_MS
      ) {
        return finish()
      }
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  } catch (err) {
    cleanup()
    onError?.(err)
    return { stop: () => {} }
  }

  return {
    stop: () => {
      if (!stopped) finish()
    }
  }
}
