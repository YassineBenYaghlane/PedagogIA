import { useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router"
import AppShell from "../layout/AppShell"
import TopBar from "../layout/TopBar"
import { TopBarBack } from "../layout/TopBarActions"
import ExerciseCard from "../exercises/ExerciseCard"
import { useSessionStore } from "../../stores/sessionStore"
import { useAuthStore } from "../../stores/authStore"

export default function ExerciseScreen() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const skillOverride = searchParams.get("skill") || null
  const { selectedChildId, children, bootstrap } = useAuthStore()
  const {
    sessionId, lockedSkillId, current, feedback, explanation, explaining,
    loading, error, start, submit, loadNext, stop, explain,
  } = useSessionStore()
  const child = children.find((c) => c.id === selectedChildId)

  useEffect(() => {
    if (!selectedChildId) {
      navigate("/children")
      return
    }
    const intentMismatch = (skillOverride || null) !== (lockedSkillId || null)
    if (!sessionId || intentMismatch) start(selectedChildId, skillOverride)
  }, [selectedChildId, sessionId, lockedSkillId, skillOverride, start, navigate])

  const handleStop = async () => {
    await stop()
    await bootstrap()
    navigate("/")
  }

  const sessionLabel = lockedSkillId ? "Séance libre" : "Établi"
  const title = child ? `${sessionLabel} · ${child.display_name}` : sessionLabel

  return (
    <AppShell
      surface="paper"
      topBar={
        <TopBar
          leading={<TopBarBack onClick={handleStop} label="Arrêter" />}
          title={title}
        />
      }
    >
      <div className="flex-1 flex flex-col items-center px-5 sm:px-6 py-6 sm:py-8">
        {error && (
          <div
            className="text-rose px-3 py-2 rounded-lg bg-rose-soft/60 mb-4 max-w-xl w-full"
            data-testid="exercise-error"
            role="alert"
          >
            {error}
          </div>
        )}

        <ExerciseCard
          key={current?.exercise?.signature || "loading"}
          exercise={current?.exercise}
          skill={current?.skill}
          grade={child?.grade}
          feedback={feedback}
          explanation={explanation}
          explaining={explaining}
          onExplain={explain}
          busy={loading}
          onSubmit={submit}
          onNext={loadNext}
        />
      </div>
    </AppShell>
  )
}
