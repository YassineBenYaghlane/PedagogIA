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
      className="fixed top-6 right-6 z-50 bg-surface-container-lowest rounded-xl shadow-ambient ghost-border p-4 flex items-center gap-3 max-w-xs"
      data-testid="badge-toast"
      role="status"
    >
      <BadgeIcon icon={current.icon} tier={current.tier} size={48} />
      <div className="text-left">
        <div className="text-xs uppercase tracking-wide text-on-surface-variant">Nouveau badge</div>
        <div className="font-headline font-bold text-on-surface">{current.label}</div>
        {current.description && (
          <div className="text-xs text-on-surface-variant mt-0.5">{current.description}</div>
        )}
      </div>
    </div>
  )
}
