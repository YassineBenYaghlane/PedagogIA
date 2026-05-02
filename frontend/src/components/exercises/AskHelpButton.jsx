import Icon from "../ui/Icon"

export default function AskHelpButton({ onClick, busy = false, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy || disabled}
      data-testid="ask-help-btn"
      className="mt-3 mb-1 inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-full bg-sky-soft/40 border border-sky/30 text-sky-deep text-sm font-medium hover:bg-sky-soft/70 hover:border-sky/50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-deep/50"
      aria-label="Ouvrir un chat avec le tuteur pour cet exercice"
    >
      {busy ? (
        <Icon name="progress_activity" className="animate-spin" size={16} />
      ) : (
        <Icon name="forum" size={16} />
      )}
      Réfléchir avec le tuteur
    </button>
  )
}
