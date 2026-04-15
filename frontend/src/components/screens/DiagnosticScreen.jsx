import { useEffect } from "react"
import { useNavigate } from "react-router"
import Icon from "../ui/Icon"
import ExerciseCard from "../exercises/ExerciseCard"
import { useDiagnosticStore } from "../../stores/diagnosticStore"
import { useAuthStore } from "../../stores/authStore"
import DiagnosticResult from "./DiagnosticResult"

export default function DiagnosticScreen() {
  const navigate = useNavigate()
  const { selectedChildId, children, bootstrap } = useAuthStore()
  const {
    sessionId, current, feedback, done, result, loading, error,
    start, submit, loadNext, reset
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
            Diagnostic · {child.display_name}
          </span>
        )}
      </div>

      {current && (
        <div className="w-full max-w-md mb-4 relative z-10" data-testid="diagnostic-progress">
          <div className="flex justify-between text-xs font-headline font-bold text-on-surface-variant mb-1">
            <span>Question {current.index + 1} / {current.total}</span>
            <span>{Math.round(progress)}%</span>
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
        <div className="text-error mb-4 relative z-10" data-testid="diagnostic-error">
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
