import { useNavigate } from "react-router"
import AppShell from "../layout/AppShell"
import Page from "../layout/Page"
import TopBar from "../layout/TopBar"
import { TopBarBack } from "../layout/TopBarActions"
import Card from "../ui/Card"
import { Heading, LatinLabel } from "../ui/Heading"
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
    <AppShell
      surface="plain"
      topBar={
        <TopBar
          leading={<TopBarBack to="/" label="Serre" />}
          title="Profil"
        />
      }
    >
      <Page maxWidth="lg" className="space-y-6">
        <div className="flex justify-end">
          <LatinLabel>Florilegium</LatinLabel>
        </div>

        <Card className="p-6 md:p-8">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <LatinLabel>Hortulanus</LatinLabel>
              <Heading level={2} className="mt-1">
                {child.display_name}
              </Heading>
              <p className="text-stem mt-1">Niveau {child.grade}</p>
            </div>
            <RankChip rank={child.rank || "curieux"} />
          </div>
          <div className="mt-6 space-y-4">
            <XPBar xp={child.xp ?? 0} />
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <StreakFlame currentStreak={child.current_streak ?? 0} />
              <span className="text-xs text-stem font-mono">
                Meilleure série · {child.best_streak ?? 0}
              </span>
            </div>
            <DailyGoalProgress
              progress={child.daily_progress ?? 0}
              goal={child.daily_goal ?? 5}
            />
          </div>
        </Card>

        <Card className="p-6 md:p-8">
          <div className="mb-4">
            <LatinLabel>Flores pressi</LatinLabel>
            <Heading level={3} className="mt-0.5">
              Mon herbier
            </Heading>
          </div>
          <BadgeGallery earned={child.achievements || []} />
        </Card>
      </Page>
    </AppShell>
  )
}
