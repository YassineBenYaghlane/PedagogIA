import { useEffect } from "react"
import { useBadgeStore } from "../../stores/badgeStore"
import { playBadge } from "../../hooks/useSound"
import BadgeIcon from "./BadgeIcon"

const DISPLAY_MS = 2800

export default function BadgeToast() {
  const queue = useBadgeStore((s) => s.queue)
  const shift = useBadgeStore((s) => s.shift)
  const current = queue[0]

  useEffect(() => {
    if (!current) return
    playBadge()
    const t = setTimeout(shift, DISPLAY_MS)
    return () => clearTimeout(t)
  }, [current, shift])

  if (!current) return null

  return (
    <div
      className="fixed top-6 right-6 z-50 tag p-4 flex items-center gap-3 max-w-xs animate-[floraison-fade_200ms_ease-out]"
      data-testid="badge-toast"
      role="status"
    >
      <BadgeIcon icon={current.icon} tier={current.tier} size={48} />
      <div className="text-left">
        <span className="latin text-[10px] uppercase tracking-wider">Novum signum</span>
        <div className="font-display font-semibold text-bark leading-tight">{current.label}</div>
        {current.description && (
          <div className="text-xs text-stem mt-0.5">{current.description}</div>
        )}
      </div>
    </div>
  )
}
