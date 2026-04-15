import { useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router"
import Icon from "../ui/Icon"
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
    loading, error, start, submit, loadNext, stop, explain
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

  return (
    <div className="min-h-screen bg-background font-body text-on-surface flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="bg-orb absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 opacity-50" />
      <div className="bg-orb absolute top-[60%] -right-[5%] w-[30%] h-[30%] bg-secondary-container/20 opacity-50" />

      <div className="w-full max-w-md mb-6 flex justify-between items-center relative z-10">
        <button
          onClick={handleStop}
          className="text-on-surface-variant hover:text-on-surface flex items-center gap-1 cursor-pointer"
        >
          <Icon name="arrow_back" /> Arrêter
        </button>
        {child && (
          <span className="text-sm font-headline font-semibold text-on-surface-variant">
            {lockedSkillId ? "Libre" : "Entraînement"} · {child.display_name}
          </span>
        )}
      </div>

      {error && (
        <div className="text-error mb-4 relative z-10" data-testid="exercise-error">
          {error}
        </div>
      )}

      <ExerciseCard
        key={current?.exercise?.signature || "loading"}
        exercise={current?.exercise}
        skill={current?.skill}
        feedback={feedback}
        explanation={explanation}
        explaining={explaining}
        onExplain={explain}
        busy={loading}
        onSubmit={submit}
        onNext={loadNext}
      />
    </div>
  )
}
