import { useEffect } from "react"
import { useNavigate } from "react-router"
import Icon from "../ui/Icon"
import ExerciseCard from "../exercises/ExerciseCard"
import { useDrillStore } from "../../stores/drillStore"
import { useAuthStore } from "../../stores/authStore"

function DrillResult({ summary, bestStreak, onBack }) {
  const pct = Math.round((summary?.accuracy || 0) * 100)
  return (
    <div className="min-h-screen bg-background font-body text-on-surface flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="bg-orb absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 opacity-50" />
      <div className="bg-surface-container-lowest rounded-xl shadow-ambient p-8 md:p-10 max-w-md w-full ghost-border relative z-10 text-center">
        <p className="text-sm uppercase tracking-wide text-on-surface-variant">Drill terminé</p>
        <h1 className="font-headline text-3xl font-extrabold text-primary mt-1">Bravo !</h1>

        <div className="grid grid-cols-3 gap-3 my-8" data-testid="drill-summary">
          <div className="bg-surface-container-low rounded-xl p-4">
            <div className="text-3xl font-headline font-extrabold text-primary">
              {summary?.correct ?? 0}
            </div>
            <div className="text-xs uppercase tracking-wide text-on-surface-variant mt-1">
              Réussies
            </div>
          </div>
          <div className="bg-surface-container-low rounded-xl p-4">
            <div className="text-3xl font-headline font-extrabold text-tertiary">{pct}%</div>
            <div className="text-xs uppercase tracking-wide text-on-surface-variant mt-1">
              Précision
            </div>
          </div>
          <div className="bg-surface-container-low rounded-xl p-4">
            <div className="text-3xl font-headline font-extrabold text-secondary">
              {Math.max(summary?.best_streak ?? 0, bestStreak)}
            </div>
            <div className="text-xs uppercase tracking-wide text-on-surface-variant mt-1">
              Meilleure série
            </div>
          </div>
        </div>

        <button
          onClick={onBack}
          className="gradient-soul text-on-primary font-headline font-bold text-xl w-full py-4 rounded-xl shadow-[0_12px_24px_rgba(0,89,182,0.3)] spring-hover cursor-pointer flex items-center justify-center gap-3"
          data-testid="drill-done"
        >
          <Icon name="home" /> Retour à l'accueil
        </button>
      </div>
    </div>
  )
}

export default function DrillScreen() {
  const navigate = useNavigate()
  const { selectedChildId, children, bootstrap } = useAuthStore()
  const {
    sessionId, current, feedback, done, summary, streak, bestStreak,
    loading, error, start, submit, loadNext, reset
  } = useDrillStore()
  const child = children.find((c) => c.id === selectedChildId)

  useEffect(() => {
    if (!selectedChildId) {
      navigate("/children")
      return
    }
    if (!sessionId && !done) start(selectedChildId)
  }, [selectedChildId, sessionId, done, start, navigate])

  const handleQuit = async () => {
    reset()
    await bootstrap()
    navigate("/")
  }

  if (done) {
    return <DrillResult summary={summary} bestStreak={bestStreak} onBack={handleQuit} />
  }

  const progress = current ? (current.index / current.total) * 100 : 0

  return (
    <div className="min-h-screen bg-background font-body text-on-surface flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="bg-orb absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 opacity-50" />
      <div className="bg-orb absolute top-[60%] -right-[5%] w-[30%] h-[30%] bg-secondary-container/20 opacity-50" />

      <div className="w-full max-w-md mb-4 flex justify-between items-center relative z-10">
        <button
          onClick={handleQuit}
          className="text-on-surface-variant hover:text-on-surface flex items-center gap-1 cursor-pointer"
        >
          <Icon name="arrow_back" /> Quitter
        </button>
        {child && (
          <span className="text-sm font-headline font-semibold text-on-surface-variant">
            Drill · {child.display_name}
          </span>
        )}
      </div>

      {current && (
        <div className="w-full max-w-md mb-4 relative z-10" data-testid="drill-progress">
          <div className="flex justify-between text-xs font-headline font-bold text-on-surface-variant mb-1">
            <span>Question {current.index + 1} / {current.total}</span>
            <span className="flex items-center gap-1">
              <Icon name="bolt" fill className="text-secondary" />
              {streak} · best {bestStreak}
            </span>
          </div>
          <div className="h-2 rounded-full bg-surface-container-low overflow-hidden">
            <div
              className="h-full gradient-soul transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="text-error mb-4 relative z-10" data-testid="drill-error">
          {error}
        </div>
      )}

      <ExerciseCard
        key={current?.exercise?.signature || "loading"}
        exercise={current?.exercise}
        skill={current?.skill}
        feedback={feedback}
        busy={loading}
        onSubmit={submit}
        onNext={loadNext}
      />
    </div>
  )
}
