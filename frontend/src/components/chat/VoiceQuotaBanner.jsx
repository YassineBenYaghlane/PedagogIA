import Icon from "../ui/Icon"

export default function VoiceQuotaBanner({ used, cap }) {
  if (!cap) return null
  const percent = Math.min(100, Math.round((used / cap) * 100))
  if (percent < 80) return null
  const remaining = Math.max(0, cap - used)
  const reached = percent >= 100
  const message = reached
    ? "Voix indisponible ce mois-ci. Réessaie le mois prochain."
    : `Plus que ${remaining.toLocaleString("fr-BE")} caractères de voix ce mois-ci.`
  const tone = reached
    ? "bg-rose/15 border-rose/30 text-bark"
    : "bg-honey/20 border-honey/40 text-bark"
  return (
    <div
      role="status"
      data-testid="voice-quota-banner"
      className={`flex items-center gap-2 px-3 py-2 border-t text-xs ${tone}`}
    >
      <Icon name={reached ? "volume_off" : "volume_up"} size={14} />
      <span>{message}</span>
    </div>
  )
}
