import { useEffect } from "react"
import { useNavigate } from "react-router"
import Icon from "../ui/Icon"
import Button from "../ui/Button"
import Card from "../ui/Card"
import Chip from "../ui/Chip"
import { Heading, LatinLabel } from "../ui/Heading"
import { useAuthStore } from "../../stores/authStore"
import RankChip from "../xp/RankChip"
import XPBar from "../xp/XPBar"
import StreakFlame from "../streak/StreakFlame"
import DailyGoalProgress from "../streak/DailyGoalProgress"
import BadgeGallery from "../badges/BadgeGallery"

const STATUS_LABELS = {
  not_started: "En sommeil",
  in_progress: "En croissance",
  mastered: "Floraison",
  needs_review: "À arroser",
}

const STATUS_TONES = {
  not_started: "text-twig",
  in_progress: "text-sage-deep",
  mastered: "text-honey",
  needs_review: "text-sky-deep",
}

function MasterySummary({ summary }) {
  if (!summary) return null
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {Object.keys(STATUS_LABELS).map((k) => (
        <Card key={k} className="p-4 text-center">
          <div className={`font-mono text-3xl font-semibold ${STATUS_TONES[k]}`}>
            {summary[k] ?? 0}
          </div>
          <div className="text-[11px] uppercase tracking-wider text-stem mt-1">
            {STATUS_LABELS[k]}
          </div>
        </Card>
      ))}
    </div>
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

  return (
    <div className="min-h-screen greenhouse">
      <div className="max-w-3xl mx-auto px-6 py-10 md:py-14">
        <header className="flex items-start justify-between gap-4 mb-8">
          <div>
            <LatinLabel>Hortus mathematicus</LatinLabel>
            <Heading level={1} className="mt-1">
              Bienvenue dans ta serre,<br />
              <em className="text-sage-deep not-italic font-display italic">
                {child.display_name}
              </em>
              .
            </Heading>
            <p className="text-stem mt-3">Niveau {child.grade}</p>
          </div>
          <button
            data-testid="logout"
            onClick={async () => {
              await logout()
              navigate("/login")
            }}
            className="text-stem hover:text-bark text-sm flex items-center gap-1 cursor-pointer"
          >
            <Icon name="logout" size={16} /> Déconnexion
          </button>
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
          <MasterySummary summary={child.mastery_summary} />
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
        </div>

        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <LatinLabel>Florilegium</LatinLabel>
              <Heading level={4} className="mt-0.5">
                Mon herbier
              </Heading>
            </div>
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

        <div className="flex items-center justify-between pt-6 border-t border-sage/10">
          <Chip tone="sky">Saison · printemps</Chip>
          <button
            onClick={() => navigate("/children")}
            className="text-stem hover:text-bark text-sm cursor-pointer"
          >
            Changer de carnet
          </button>
        </div>
      </div>
    </div>
  )
}
