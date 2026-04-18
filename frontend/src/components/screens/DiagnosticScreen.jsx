import { useEffect } from "react"
import { useNavigate } from "react-router"
import AppShell from "../layout/AppShell"
import TopBar from "../layout/TopBar"
import { TopBarBack } from "../layout/TopBarActions"
import ProgressBar from "../ui/ProgressBar"
import ExerciseCard from "../exercises/ExerciseCard"
import LevelGauge from "../exercises/LevelGauge"
import { useDiagnosticStore } from "../../stores/diagnosticStore"
import { useAuthStore } from "../../stores/authStore"
import DiagnosticResult from "./DiagnosticResult"

export default function DiagnosticScreen() {
  const navigate = useNavigate()
  const { selectedChildId, children, bootstrap } = useAuthStore()
  const {
    sessionId, current, feedback, done, result, loading, error,
    start, submit, loadNext, reset,
  } = useDiagnosticStore()
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

  if (done && result) {
    return <DiagnosticResult result={result} child={child} onBack={handleQuit} />
  }

  const progress = current ? current.index + 1 : 0
  const total = current?.total ?? 0

  const title = child ? `Test de Niveau · ${child.display_name}` : "Test de Niveau"

  return (
    <AppShell
      surface="paper"
      topBar={
        <TopBar
          leading={<TopBarBack onClick={handleQuit} label="Quitter" />}
          title={title}
        />
      }
    >
      <div className="flex-1 flex flex-col items-center px-5 sm:px-6 py-6 sm:py-8">
        {current && (
          <div className="w-full max-w-xl mb-4" data-testid="diagnostic-progress">
            <ProgressBar
              value={progress}
              max={total}
              tone="sage"
              label={`Question ${progress} / ${total}`}
            />
          </div>
        )}

        {error && (
          <div
            className="text-rose px-3 py-2 rounded-lg bg-rose-soft/60 mb-4 max-w-xl w-full"
            data-testid="diagnostic-error"
            role="alert"
          >
            {error}
          </div>
        )}

        <div className="relative w-full flex justify-center">
          <div className="w-full max-w-xl">
            <ExerciseCard
              key={current?.exercise?.signature || "loading"}
              exercise={current?.exercise}
              skill={current?.skill}
              grade={child?.grade}
              feedback={feedback}
              busy={loading}
              onSubmit={submit}
              onNext={loadNext}
              mode="diagnostic"
            />
          </div>
          {current && (
            <div className="hidden lg:block absolute right-6 top-2">
              <LevelGauge
                grade={current?.cursor?.grade || current?.skill?.grade}
                difficulty={current?.cursor?.difficulty || current?.difficulty}
              />
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
