import { useState } from "react"
import { useAuthStore } from "../../stores/authStore"

const OPTIONS = [
  { value: "female", label: "Voix F", aria: "Voix féminine" },
  { value: "male", label: "Voix M", aria: "Voix masculine" }
]

export default function VoiceToggle({ child }) {
  const updateChild = useAuthStore((s) => s.updateChild)
  const [pending, setPending] = useState(null)
  const current = pending ?? child?.tutor_voice ?? "female"

  const pick = async (value) => {
    if (value === current || pending) return
    setPending(value)
    try {
      await updateChild(child.id, { tutor_voice: value })
    } catch {
      // swallow — server is the source of truth on next refresh
    } finally {
      setPending(null)
    }
  }

  return (
    <div
      role="radiogroup"
      aria-label="Voix du tuteur"
      data-testid="voice-toggle"
      className="inline-flex items-center rounded-full border border-sage/25 bg-bone p-0.5 text-xs"
    >
      {OPTIONS.map((opt) => {
        const active = current === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={opt.aria}
            onClick={() => pick(opt.value)}
            data-testid={`voice-toggle-${opt.value}`}
            className={`px-2.5 py-1 rounded-full transition-colors duration-200 cursor-pointer ${
              active
                ? "bg-sage-deep text-bone"
                : "text-stem hover:text-bark hover:bg-sage-leaf/30"
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
