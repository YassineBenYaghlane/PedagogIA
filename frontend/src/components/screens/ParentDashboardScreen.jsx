import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router"
import { useAuthStore } from "../../stores/authStore"
import { fetchParentOverview } from "../../api/parent"
import AppShell from "../layout/AppShell"
import Page from "../layout/Page"
import TopBar from "../layout/TopBar"
import { TopBarLink, TopBarButton } from "../layout/TopBarActions"
import Button from "../ui/Button"
import Card from "../ui/Card"
import Chip from "../ui/Chip"
import ProgressBar from "../ui/ProgressBar"
import { Heading, LatinLabel } from "../ui/Heading"

const MODE_LABELS = {
  learn: "Entraînement",
  diagnostic: "Test de Niveau",
  drill: "Automatismes",
  exam: "Examen",
}

function formatDate(iso) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("fr-BE", { day: "2-digit", month: "short" })
}

function formatDuration(seconds) {
  if (!seconds) return "—"
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m === 0) return `${s}s`
  return `${m}m${s.toString().padStart(2, "0")}`
}

function StudentCard({ student, onOpenDetail }) {
  const m = student.mastery_summary || {}
  const total =
    (m.not_started || 0) + (m.in_progress || 0) + (m.mastered || 0) + (m.needs_review || 0)
  const g = student.gamification || {}
  const week = student.last_7_days || { sessions: 0, attempts: 0, accuracy: 0, by_day: [] }
  const weekPct = Math.round((week.accuracy || 0) * 100)
  const dailyGoal = g.daily_goal || 0
  const dailyDone = g.daily_progress || 0

  return (
    <Card variant="specimen" className="p-6" data-testid={`parent-student-${student.id}`}>
      <div className="flex items-baseline justify-between gap-4 mb-4">
        <div>
          <Heading level={3} className="text-sage-deep">
            {student.display_name}
          </Heading>
          <LatinLabel className="block mt-1">Niveau {student.grade}</LatinLabel>
        </div>
        <Button variant="ghost" onClick={() => onOpenDetail(student)}>
          Voir en détail →
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <LatinLabel>Hortus · Maîtrise</LatinLabel>
            <span className="font-mono text-xs text-stem tabular-nums">
              {m.mastered || 0} / {total}
            </span>
          </div>
          <ProgressBar value={m.mastered || 0} max={Math.max(total, 1)} tone="sage" />
          <div className="flex flex-wrap gap-1.5">
            <Chip tone="sage">{m.mastered || 0} floraison</Chip>
            <Chip tone="sky">{m.in_progress || 0} en croissance</Chip>
            <Chip tone="honey">{m.needs_review || 0} à arroser</Chip>
            <Chip tone="bark">{m.not_started || 0} en sommeil</Chip>
          </div>
        </section>

        <section>
          <LatinLabel>Activité récente</LatinLabel>
          <div className="mt-2 text-sm text-stem">
            7 derniers jours :{" "}
            <span className="text-bark font-medium">{week.attempts}</span> exercices ·{" "}
            <span className="text-bark font-medium">{weekPct}%</span> de réussite ·{" "}
            {week.sessions} session{week.sessions > 1 ? "s" : ""}
          </div>
          <ul className="mt-3 space-y-1.5">
            {(student.recent_sessions || []).slice(0, 5).map((s) => {
              const pct = Math.round((s.accuracy || 0) * 100)
              const tone =
                pct >= 80 ? "text-sage-deep" : pct >= 40 ? "text-honey" : "text-rose"
              return (
                <li
                  key={s.id}
                  className="flex items-baseline justify-between gap-2 text-sm"
                >
                  <span className="text-stem truncate">
                    {formatDate(s.started_at)} · {MODE_LABELS[s.mode] || s.mode}
                  </span>
                  <span className="font-mono tabular-nums text-xs flex items-center gap-2">
                    <span className="text-stem">{formatDuration(s.duration_seconds)}</span>
                    <span className={tone}>{pct}%</span>
                  </span>
                </li>
              )
            })}
            {(student.recent_sessions || []).length === 0 && (
              <li className="latin text-sm">Aucune session pour le moment.</li>
            )}
          </ul>
        </section>

        <section className="space-y-3">
          <LatinLabel>Progrès</LatinLabel>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="font-display text-2xl text-sage-deep tabular-nums">
                {g.xp || 0}
              </div>
              <div className="latin text-[10px]">XP</div>
            </div>
            <div>
              <div className="font-display text-2xl text-sage-deep tabular-nums">
                {g.current_streak || 0}
              </div>
              <div className="latin text-[10px]">série</div>
            </div>
            <div>
              <div className="font-display text-2xl text-sage-deep tabular-nums">
                {g.best_streak || 0}
              </div>
              <div className="latin text-[10px]">record</div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-stem mb-1">
              <span>Objectif du jour</span>
              <span className="font-mono tabular-nums">
                {dailyDone} / {Math.max(dailyGoal, 1)}
              </span>
            </div>
            <ProgressBar value={dailyDone} max={Math.max(dailyGoal, 1)} tone="honey" />
          </div>
          <div className="text-xs text-stem">
            Rang :{" "}
            <span className="text-bark font-medium capitalize">{g.rank || "—"}</span>
          </div>
        </section>
      </div>
    </Card>
  )
}

export default function ParentDashboardScreen() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const { data, isLoading, error } = useQuery({
    queryKey: ["parent-overview"],
    queryFn: fetchParentOverview,
  })

  const onOpenDetail = (student) => {
    useAuthStore.getState().selectChild(student.id)
    navigate("/history?from=parent")
  }

  const students = data?.students || []

  return (
    <AppShell
      surface="greenhouse"
      topBar={
        <TopBar
          trailing={
            <>
              <TopBarLink to="/children" icon="child_care" data-testid="go-child-mode">
                Mode enfant
              </TopBarLink>
              <TopBarButton onClick={logout} icon="logout" data-testid="logout">
                Déconnexion
              </TopBarButton>
            </>
          }
        />
      }
    >
      <Page maxWidth="3xl">
        <header className="mb-10">
          <LatinLabel>Custos horti</LatinLabel>
          <Heading level={2} className="mt-1 text-balance">
            Espace parent
            {user?.display_name ? (
              <>
                {" "}
                ·{" "}
                <em className="text-sage-deep not-italic font-display italic">
                  {user.display_name}
                </em>
              </>
            ) : null}
          </Heading>
          <p className="text-stem mt-3">
            Vue d’ensemble de chaque jardin — progrès, sessions récentes et objectifs.
          </p>
        </header>

        {isLoading && <p className="latin text-center py-10">Chargement du jardin…</p>}
        {error && (
          <Card variant="paper" className="p-6 text-rose">
            Impossible de charger les données ({error.message}).
          </Card>
        )}

        {!isLoading && !error && students.length === 0 && (
          <Card variant="tag" className="p-6">
            <p className="latin">
              Aucun profil pour le moment. Ajoute un carnet depuis le mode enfant.
            </p>
            <Button className="mt-4" onClick={() => navigate("/children")}>
              Aller au mode enfant
            </Button>
          </Card>
        )}

        <div
          className="grid gap-6 grid-cols-1"
          data-testid="parent-students-list"
        >
          {students.map((s) => (
            <StudentCard key={s.id} student={s} onOpenDetail={onOpenDetail} />
          ))}
        </div>
      </Page>
    </AppShell>
  )
}
