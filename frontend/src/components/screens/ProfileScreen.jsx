import { useNavigate } from "react-router"
import Icon from "../ui/Icon"
import { useAuthStore } from "../../stores/authStore"
import RankChip from "../xp/RankChip"
import XPBar from "../xp/XPBar"
import StreakFlame from "../streak/StreakFlame"
import DailyGoalProgress from "../streak/DailyGoalProgress"
import BadgeGallery from "../badges/BadgeGallery"

export default function ProfileScreen() {
  const navigate = useNavigate()
  const { children, selectedChildId } = useAuthStore()
  const child = children.find((c) => c.id === selectedChildId)

  if (!child) {
    navigate("/children")
    return null
  }

  return (
    <div className="min-h-screen bg-background font-body text-on-surface p-6 relative overflow-hidden">
      <div className="bg-orb absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 opacity-50" />
      <div className="max-w-2xl mx-auto relative z-10 space-y-6">
        <div className="flex justify-between items-center">
          <button
            onClick={() => navigate("/")}
            className="text-on-surface-variant hover:text-on-surface flex items-center gap-1 cursor-pointer"
          >
            <Icon name="arrow_back" /> Accueil
          </button>
        </div>

        <div className="bg-surface-container-lowest rounded-xl shadow-ambient ghost-border p-6 md:p-8">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm uppercase tracking-wide text-on-surface-variant">Profil</p>
              <h1 className="font-headline text-3xl font-extrabold text-primary">
                {child.display_name}
              </h1>
              <p className="text-on-surface-variant">Niveau {child.grade}</p>
            </div>
            <RankChip rank={child.rank || "curieux"} />
          </div>
          <div className="mt-6 space-y-4">
            <XPBar xp={child.xp ?? 0} />
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <StreakFlame currentStreak={child.current_streak ?? 0} />
              <span className="text-xs text-on-surface-variant font-headline font-bold">
                Meilleure série : {child.best_streak ?? 0}
              </span>
            </div>
            <DailyGoalProgress
              progress={child.daily_progress ?? 0}
              goal={child.daily_goal ?? 5}
            />
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl shadow-ambient ghost-border p-6 md:p-8">
          <h2 className="font-headline font-bold text-lg mb-4">Mes orbes</h2>
          <BadgeGallery earned={child.achievements || []} />
        </div>
      </div>
    </div>
  )
}
