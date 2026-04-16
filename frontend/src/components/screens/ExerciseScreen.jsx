import { useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router"
import Icon from "../ui/Icon"
import { LatinLabel } from "../ui/Heading"
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

  return (
    <div className="min-h-screen paper-rule flex flex-col items-center p-6">
      <div className="w-full max-w-xl mb-6 flex justify-between items-center">
        <button
          onClick={handleStop}
          className="text-stem hover:text-bark flex items-center gap-1.5 cursor-pointer text-sm"
        >
          <Icon name="arrow_back" size={16} /> Arrêter
        </button>
        {child && (
          <div className="text-right">
            <LatinLabel>In officina</LatinLabel>
            <div className="text-sm text-bark font-semibold">
              {lockedSkillId ? "Séance libre" : "Établi"} · {child.display_name}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div
          className="text-rose px-3 py-2 rounded-lg bg-rose-soft/60 mb-4"
          data-testid="exercise-error"
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
  )
}
