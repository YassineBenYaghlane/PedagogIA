import Icon from "../ui/Icon"
import { TURN_STATES } from "../../lib/useConversationFlow"

const VARIANTS = {
  [TURN_STATES.BOT]: {
    label: "Le tuteur parle…",
    icon: "volume_up",
    bg: "bg-sky-soft/70",
    border: "border-sky/30",
    text: "text-sky-deep",
    pulse: true
  },
  [TURN_STATES.LISTENING]: {
    label: "À toi de parler",
    icon: "mic",
    bg: "bg-sage-leaf/50",
    border: "border-sage/30",
    text: "text-sage-deep",
    pulse: true
  },
  [TURN_STATES.TRANSCRIBING]: {
    label: "J'écris ta phrase…",
    icon: "progress_activity",
    bg: "bg-mist/70",
    border: "border-sage/20",
    text: "text-stem",
    pulse: false,
    spin: true
  }
}

export default function TurnIndicator({ turn, onCancel }) {
  const v = VARIANTS[turn]
  if (!v) return null
  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="turn-indicator"
      data-turn={turn}
      className={`flex items-center justify-between gap-3 px-3 py-2 border-t ${v.bg} ${v.border} transition-colors duration-200 ease-out`}
    >
      <div className={`flex items-center gap-2 text-xs font-semibold ${v.text}`}>
        <span
          className="relative inline-flex items-center justify-center w-6 h-6 rounded-full bg-bone/70"
          aria-hidden="true"
        >
          {v.pulse && (
            <span className="absolute inset-0 rounded-full bg-current opacity-25 motion-safe:animate-ping motion-reduce:hidden" />
          )}
          <Icon name={v.icon} size={13} className={v.spin ? "animate-spin" : ""} />
        </span>
        <span>{v.label}</span>
      </div>
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          aria-label="Quitter le mode conversation"
          data-testid="turn-cancel"
          className="text-stem hover:text-bark transition-colors duration-200 ease-out cursor-pointer text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-deep/40 rounded px-1"
        >
          Stop
        </button>
      )}
    </div>
  )
}
