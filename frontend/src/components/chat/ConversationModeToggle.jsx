import Icon from "../ui/Icon"

export default function ConversationModeToggle({ active, onToggle, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label="Mode conversation"
      onClick={onToggle}
      disabled={disabled}
      data-testid="conversation-mode-toggle"
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors duration-200 ease-out cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-deep/40 ${
        active
          ? "bg-sage-deep text-bone border-sage-deep"
          : "bg-bone text-stem border-sage/25 hover:text-bark hover:bg-sage-leaf/30"
      }`}
    >
      <Icon name={active ? "forum" : "chat_bubble"} size={13} />
      <span>Conversation</span>
    </button>
  )
}
