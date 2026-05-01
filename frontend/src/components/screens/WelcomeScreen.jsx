import { useEffect } from "react"
import { useNavigate } from "react-router"
import Icon from "../ui/Icon"
import Button from "../ui/Button"
import Card from "../ui/Card"
import Chip from "../ui/Chip"
import { Heading } from "../ui/Heading"
import AppShell from "../layout/AppShell"
import Page from "../layout/Page"
import TopBar from "../layout/TopBar"
import { TopBarButton, TopBarLink } from "../layout/TopBarActions"
import { useAuthStore } from "../../stores/authStore"
import RankChip from "../xp/RankChip"
import XPBar from "../xp/XPBar"
import StreakFlame from "../streak/StreakFlame"
import DailyGoalProgress from "../streak/DailyGoalProgress"
import BadgeGallery from "../badges/BadgeGallery"
import AnimatedPlant, { PlantKeyframes } from "../ui/PlantAnimated"

const MASTERY_BUCKETS = [
  {
    key: "not_started",
    label: "À découvrir",
    plant: { status: "locked", mastery: 0 },
    tone: "text-stem",
    focus: "not_started",
    count: (s) => s.not_started ?? 0,
  },
  {
    key: "learning_easy",
    label: "Découverte",
    plant: { status: "in_progress", mastery: 0.1 },
    tone: "text-stem",
    focus: "learning_easy",
    count: (s) => s.learning_easy ?? 0,
  },
  {
    key: "in_progress",
    label: "En cours",
    plant: { status: "in_progress", mastery: 0.55 },
    tone: "text-sage-deep",
    focus: "in_progress",
    count: (s) => (s.learning_medium ?? 0) + (s.learning_hard ?? 0),
  },
  {
    key: "mastered",
    label: "Acquis",
    plant: { status: "done", mastery: 1 },
    tone: "text-stem",
    focus: "mastered",
    count: (s) => s.mastered ?? 0,
  },
  {
    key: "needs_review",
    label: "À revoir",
    plant: { status: "wilted", mastery: 0 },
    tone: "text-sky-deep",
    focus: "needs_review",
    count: (s) => s.needs_review ?? 0,
  },
]

function MasterySummary({ summary, onFocus }) {
  if (!summary) return null
  const total = MASTERY_BUCKETS.reduce((sum, b) => sum + b.count(summary), 0)
  const started = total - (summary.not_started ?? 0)
  return (
    <section aria-labelledby="mastery-heading">
      <div className="flex items-baseline justify-between mb-3">
        <Heading level={4} id="mastery-heading">
          Maîtrise
        </Heading>
        <span className="font-mono text-xs text-stem tabular-nums">
          {started} / {total} commencé
        </span>
      </div>
      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
        {MASTERY_BUCKETS.map(({ key, label, plant, tone, focus, count }) => {
          const value = count(summary)
          const interactive = value > 0
          return (
            <button
              key={key}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onFocus(focus)}
              data-testid={`mastery-card-${key}`}
              className={`bg-paper border border-sage/15 rounded-2xl p-3 flex flex-col items-center text-center transition-colors duration-200 ${
                interactive
                  ? "cursor-pointer hover:bg-sage-leaf/30 hover:border-sage/35 focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-deep"
                  : "opacity-55 cursor-default"
              }`}
            >
              <span
                className="flex items-center justify-center"
                style={{ width: 44, height: 52 }}
              >
                <AnimatedPlant
                  status={plant.status}
                  mastery={plant.mastery}
                  pot={false}
                  halo={false}
                  drops={false}
                  pollen={false}
                />
              </span>
              <span className={`font-mono text-2xl font-semibold mt-1 ${tone}`}>
                {value}
              </span>
              <span className="text-[11px] uppercase tracking-wider text-stem mt-0.5">
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

export default function WelcomeScreen() {
  const navigate = useNavigate()
  const { children, selectedChildId, logout } = useAuthStore()
  const child = children.find((c) => c.id === selectedChildId)

  useEffect(() => {
    if (children.length === 0 || !selectedChildId) navigate("/children")
  }, [children, selectedChildId, navigate])

  if (!child) return null

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }

  return (
    <AppShell
      surface="greenhouse"
      topBar={
        <TopBar
          trailing={
            <>
              <TopBarLink to="/children" icon="child_care" data-testid="switch-child">
                Espace enfant
              </TopBarLink>
              <TopBarButton onClick={handleLogout} icon="logout" data-testid="logout">
                Déconnexion
              </TopBarButton>
            </>
          }
        />
      }
    >
      <PlantKeyframes />
      <Page maxWidth="xl">
        <header className="mb-8">
          <Heading level={1} className="text-balance">
            Bienvenue dans ta serre,{" "}
            <em className="text-sage-deep not-italic font-display italic">
              {child.display_name}
            </em>
            .
          </Heading>
          <p className="text-stem mt-3">Niveau {child.grade}</p>
        </header>

        <Card className="p-5 md:p-6 mb-6 space-y-4" data-testid="gamification-header">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <RankChip rank={child.rank || "curieux"} />
            <StreakFlame currentStreak={child.current_streak ?? 0} />
          </div>
          <XPBar xp={child.xp ?? 0} />
          <DailyGoalProgress
            progress={child.daily_progress ?? 0}
            goal={child.daily_goal ?? 5}
          />
        </Card>

        <div className="mb-6">
          <MasterySummary
            summary={child.mastery_summary}
            onFocus={(bucket) => navigate(`/skill-tree?focus=${bucket}`)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
          <Button
            data-testid="start-training"
            onClick={() => navigate("/exercise")}
            size="lg"
            className="md:col-span-2"
          >
            <Icon name="play_arrow" fill /> Entraînement
          </Button>
          <Button variant="ghost" size="md" onClick={() => navigate("/skill-tree")}>
            <Icon name="account_tree" /> Carte des compétences
          </Button>
          <Button
            data-testid="start-drill"
            variant="ghost"
            size="md"
            onClick={() => navigate("/drill")}
          >
            <Icon name="bolt" fill /> Automatismes
          </Button>
          <Button
            data-testid="start-diagnostic"
            variant="ghost"
            size="md"
            onClick={() => navigate("/diagnostic")}
          >
            <Icon name="insights" /> Test de Niveau
          </Button>
          <Button
            data-testid="start-exam"
            variant="ghost"
            size="md"
            onClick={() => navigate("/exam")}
          >
            <Icon name="assignment" /> Examen
          </Button>
          <Button
            data-testid="open-history"
            variant="ghost"
            size="md"
            onClick={() => navigate("/history")}
          >
            <Icon name="history" /> Historique
          </Button>
          <Button
            data-testid="open-chat"
            variant="ghost"
            size="md"
            onClick={() => navigate("/chat")}
          >
            <Icon name="chat_bubble" /> Pose ta question
          </Button>
        </div>

        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <Heading level={4}>Mon herbier</Heading>
            <button
              onClick={() => navigate("/profile")}
              className="text-xs font-semibold text-sage-deep hover:underline cursor-pointer"
              data-testid="open-profile"
            >
              Tout voir →
            </button>
          </div>
          <BadgeGallery earned={child.achievements || []} compact />
        </section>

        <div className="flex items-center pt-6 border-t border-sage/10">
          <Chip tone="sky">Saison · printemps</Chip>
        </div>

        {import.meta.env.VITE_APP_VERSION && (
          <p
            className="mt-6 text-center font-mono text-[10px] uppercase tracking-wider text-stem/60"
            data-testid="app-version"
          >
            {import.meta.env.VITE_APP_VERSION}
          </p>
        )}
      </Page>
    </AppShell>
  )
}
