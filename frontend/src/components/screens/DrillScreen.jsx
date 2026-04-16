import { useEffect } from "react"
import { useNavigate } from "react-router"
import Icon from "../ui/Icon"
import Button from "../ui/Button"
import Card from "../ui/Card"
import Chip from "../ui/Chip"
import ProgressBar from "../ui/ProgressBar"
import { Heading, LatinLabel } from "../ui/Heading"
import ExerciseCard from "../exercises/ExerciseCard"
import { useDrillStore } from "../../stores/drillStore"
import { useAuthStore } from "../../stores/authStore"

function DrillResult({ summary, bestStreak, onBack }) {
  const pct = Math.round((summary?.accuracy || 0) * 100)
  return (
    <div className="min-h-screen water flex flex-col items-center justify-center p-6">
      <Card className="p-8 md:p-10 max-w-md w-full text-center">
        <LatinLabel>Exercitatio peracta</LatinLabel>
        <Heading level={2} className="mt-1">Bravo !</Heading>

        <div className="grid grid-cols-3 gap-3 my-8" data-testid="drill-summary">
          <Card className="p-4">
            <div className="font-mono text-3xl font-semibold text-sage-deep">
              {summary?.correct ?? 0}
            </div>
            <div className="text-[11px] uppercase tracking-wider text-stem mt-1">Réussies</div>
          </Card>
          <Card className="p-4">
            <div className="font-mono text-3xl font-semibold text-sky-deep">{pct}%</div>
            <div className="text-[11px] uppercase tracking-wider text-stem mt-1">Précision</div>
          </Card>
          <Card className="p-4">
            <div className="font-mono text-3xl font-semibold text-honey">
              {Math.max(summary?.best_streak ?? 0, bestStreak)}
            </div>
            <div className="text-[11px] uppercase tracking-wider text-stem mt-1">Meilleure série</div>
          </Card>
        </div>

        <Button onClick={onBack} size="lg" className="w-full" data-testid="drill-done">
          <Icon name="home" /> Retour à la serre
        </Button>
      </Card>
    </div>
  )
}

export default function DrillScreen() {
  const navigate = useNavigate()
  const { selectedChildId, children, bootstrap } = useAuthStore()
  const {
    sessionId, current, feedback, done, summary, streak, bestStreak,
    loading, error, start, submit, loadNext, reset,
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

  if (done) return <DrillResult summary={summary} bestStreak={bestStreak} onBack={handleQuit} />

  const progress = current ? current.index + 1 : 0
  const total = current?.total ?? 0

  return (
    <div className="min-h-screen paper-rule flex flex-col items-center p-6">
      <div className="w-full max-w-xl mb-4 flex justify-between items-center">
        <button
          onClick={handleQuit}
          className="text-stem hover:text-bark flex items-center gap-1.5 cursor-pointer text-sm"
        >
          <Icon name="arrow_back" size={16} /> Quitter
        </button>
        {child && (
          <div className="text-right">
            <LatinLabel>Exercitatio</LatinLabel>
            <div className="text-sm text-bark font-semibold">Automatismes · {child.display_name}</div>
          </div>
        )}
      </div>

      {current && (
        <div className="w-full max-w-xl mb-4" data-testid="drill-progress">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-stem font-mono">
              Question {progress} / {total}
            </span>
            <Chip tone="honey" className="!text-[10px]">
              <Icon name="bolt" size={12} fill /> {streak} · best {bestStreak}
            </Chip>
          </div>
          <ProgressBar value={progress} max={total} tone="sage" />
        </div>
      )}

      {error && (
        <div className="text-rose px-3 py-2 rounded-lg bg-rose-soft/60 mb-4" data-testid="drill-error">
          {error}
        </div>
      )}

      <ExerciseCard
        key={current?.exercise?.signature || "loading"}
        exercise={current?.exercise}
        skill={current?.skill}
        grade={child?.grade}
        feedback={feedback}
        busy={loading}
        onSubmit={submit}
        onNext={loadNext}
      />
    </div>
  )
}
