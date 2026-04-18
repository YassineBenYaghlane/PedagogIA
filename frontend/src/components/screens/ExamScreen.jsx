import { useEffect } from "react"
import { useNavigate } from "react-router"
import AppShell from "../layout/AppShell"
import TopBar from "../layout/TopBar"
import { TopBarBack } from "../layout/TopBarActions"
import Icon from "../ui/Icon"
import Button from "../ui/Button"
import Card from "../ui/Card"
import ProgressBar from "../ui/ProgressBar"
import { Heading, LatinLabel } from "../ui/Heading"
import ExerciseCard from "../exercises/ExerciseCard"
import { useExamStore } from "../../stores/examStore"
import { useAuthStore } from "../../stores/authStore"

function ExamResult({ summary, onBack }) {
  const pct = Math.round((summary?.accuracy || 0) * 100)
  const breakdown = summary?.breakdown || []
  return (
    <AppShell surface="water">
      <div className="flex-1 flex flex-col items-center justify-center p-5 sm:p-6">
      <Card className="p-6 sm:p-8 md:p-10 max-w-lg w-full">
        <div className="text-center">
          <LatinLabel>Examinatio peracta</LatinLabel>
          <Heading level={2} className="mt-1">Résultat</Heading>

          <div className="grid grid-cols-2 gap-3 my-6" data-testid="exam-summary">
            <Card className="p-4">
              <div className="font-mono text-3xl font-semibold text-sage-deep">
                {summary?.score ?? "0/0"}
              </div>
              <div className="text-[11px] uppercase tracking-wider text-stem mt-1">Score</div>
            </Card>
            <Card className="p-4">
              <div className="font-mono text-3xl font-semibold text-sky-deep">{pct}%</div>
              <div className="text-[11px] uppercase tracking-wider text-stem mt-1">Précision</div>
            </Card>
          </div>
        </div>

        {breakdown.length > 0 && (
          <div className="mt-4 mb-6" data-testid="exam-breakdown">
            <LatinLabel className="block mb-2">Detalium</LatinLabel>
            <ul className="divide-y divide-bark/5 text-sm">
              {breakdown.map((b) => (
                <li key={b.index} className="py-2 flex items-center gap-3">
                  <Icon
                    name={b.is_correct ? "check_circle" : "cancel"}
                    className={b.is_correct ? "text-sage-deep" : "text-rose"}
                    size={18}
                    fill
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-bark truncate">{b.skill_label}</div>
                    {!b.is_correct && (
                      <div className="text-xs text-stem font-mono">
                        Ta réponse : {b.student_answer} · Attendu : {b.correct_answer}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button onClick={onBack} size="lg" className="w-full" data-testid="exam-done">
          <Icon name="home" /> Retour à la serre
        </Button>
      </Card>
      </div>
    </AppShell>
  )
}

export default function ExamScreen() {
  const navigate = useNavigate()
  const { selectedChildId, children, bootstrap } = useAuthStore()
  const {
    sessionId, current, feedback, done, summary,
    loading, error, start, submit, loadNext, reset,
  } = useExamStore()
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

  if (done) return <ExamResult summary={summary} onBack={handleQuit} />

  const progress = current ? current.index + 1 : 0
  const total = current?.total ?? 0

  const title = child ? `Examen · ${child.display_name}` : "Examen"

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
          <div className="w-full max-w-xl mb-4" data-testid="exam-progress">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-stem font-mono">
                Question {progress} / {total}
              </span>
            </div>
            <ProgressBar value={progress} max={total} tone="sage" />
          </div>
        )}

        {error && (
          <div
            className="text-rose px-3 py-2 rounded-lg bg-rose-soft/60 mb-4 max-w-xl w-full"
            data-testid="exam-error"
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
          busy={loading}
          onSubmit={submit}
          onNext={loadNext}
          mode="exam"
        />
      </div>
    </AppShell>
  )
}
