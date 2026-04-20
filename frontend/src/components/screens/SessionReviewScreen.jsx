import { useEffect, useMemo, useState } from "react"
import { Link, useParams, useSearchParams } from "react-router"
import AppShell from "../layout/AppShell"
import Page from "../layout/Page"
import TopBar from "../layout/TopBar"
import { TopBarBack } from "../layout/TopBarActions"
import Icon from "../ui/Icon"
import Card from "../ui/Card"
import Chip from "../ui/Chip"
import Loader from "../ui/Loader"
import { Heading } from "../ui/Heading"
import { useAuthStore } from "../../stores/authStore"
import { fetchSession, fetchSessionAttempts } from "../../api/sessions"
import { downloadDiagnosticPdf } from "../../api/history"

const MODE_LABELS = {
  training: "Entraînement",
  diagnostic: "Test de Niveau",
  drill: "Automatismes",
  exam: "Examen",
}

function formatDateTime(iso) {
  if (!iso) return "—"
  const d = new Date(iso)
  return d.toLocaleString("fr-BE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatTime(iso) {
  if (!iso) return ""
  const d = new Date(iso)
  return d.toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
}

function formatDuration(seconds) {
  if (seconds == null) return "—"
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m === 0) return `${s}s`
  return `${m}m${s.toString().padStart(2, "0")}`
}

function paramsSummary(params) {
  if (!params || typeof params !== "object") return ""
  return Object.entries(params)
    .filter(([k]) => k !== "options")
    .map(([k, v]) => `${k} = ${Array.isArray(v) ? v.join(", ") : v}`)
    .join(" · ")
}

function mcqOptions(params, studentAnswer, correctAnswer) {
  const opts = params?.options
  if (!Array.isArray(opts) || opts.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1.5 mt-2" data-testid="mcq-options">
      {opts.map((opt) => {
        const isCorrect = String(opt) === String(correctAnswer)
        const isPicked = String(opt) === String(studentAnswer)
        const tone = isCorrect
          ? "bg-sage-leaf/60 text-sage-deep border-sage"
          : isPicked
            ? "bg-rose-soft text-rose border-rose/40"
            : "bg-chalk text-stem border-bark/10"
        return (
          <span
            key={opt}
            className={`px-2 py-0.5 rounded-full text-xs font-mono tabular-nums border ${tone}`}
          >
            {opt}
            {isCorrect ? " ✓" : isPicked ? " ✗" : ""}
          </span>
        )
      })}
    </div>
  )
}

function AttemptRow({ attempt, index }) {
  const ok = attempt.is_correct
  return (
    <div
      className={`border-b border-sage/10 last:border-0 py-4 px-2 -mx-2 ${
        ok ? "" : "bg-rose-soft/30"
      }`}
      data-testid={`attempt-${attempt.id}`}
    >
      <div className="flex items-baseline justify-between gap-3 mb-1">
        <div className="flex items-baseline gap-2 min-w-0">
          <span className="font-mono text-xs text-stem tabular-nums">#{index + 1}</span>
          <span className="text-xs text-stem truncate">
            {attempt.skill_label || attempt.skill}
          </span>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <span className="text-[10px] text-stem font-mono">
            {formatTime(attempt.responded_at)}
          </span>
          {ok ? (
            <Chip tone="sage">Correct</Chip>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose/20 text-rose">
              Incorrect
            </span>
          )}
        </div>
      </div>
      <div className="font-display text-bark text-lg">
        {attempt.prompt || paramsSummary(attempt.exercise_params) || "—"}
      </div>
      {mcqOptions(attempt.exercise_params, attempt.student_answer, attempt.correct_answer)}
      <div className="grid grid-cols-2 gap-3 text-sm mt-3">
        <div>
          <div className="text-[10px] text-stem uppercase tracking-wider">Réponse de l’élève</div>
          <div
            className={`font-mono tabular-nums ${ok ? "text-sage-deep" : "text-rose"}`}
            data-testid="student-answer"
          >
            {attempt.student_answer || "—"}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-stem uppercase tracking-wider">Bonne réponse</div>
          <div className="font-mono tabular-nums text-bark">{attempt.correct_answer}</div>
        </div>
      </div>
    </div>
  )
}

export default function SessionReviewScreen() {
  const { sessionId } = useParams()
  const [searchParams] = useSearchParams()
  const fromParent = searchParams.get("from") === "parent"
  const { children, selectedChildId } = useAuthStore()

  const [session, setSession] = useState(null)
  const [attempts, setAttempts] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([fetchSession(sessionId), fetchSessionAttempts(sessionId)])
      .then(([s, a]) => {
        if (!cancelled) {
          setSession(s)
          setAttempts(a)
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.status === 404 ? "Session introuvable." : err.message)
      })
    return () => {
      cancelled = true
    }
  }, [sessionId])

  const child = useMemo(() => {
    if (!session) return null
    return (
      children.find((c) => c.id === session.student) ||
      children.find((c) => c.id === selectedChildId)
    )
  }, [session, children, selectedChildId])

  const totals = useMemo(() => {
    if (!attempts) return null
    const total = attempts.length
    const correct = attempts.filter((a) => a.is_correct).length
    const pct = total ? Math.round((correct / total) * 100) : 0
    return { total, correct, pct }
  }, [attempts])

  const duration = useMemo(() => {
    if (!session?.started_at || !session?.ended_at) return null
    const s = new Date(session.started_at).getTime()
    const e = new Date(session.ended_at).getTime()
    return Math.max(0, Math.round((e - s) / 1000))
  }, [session])

  const backTo = fromParent ? "/history?from=parent" : "/history"

  if (error) {
    return (
      <AppShell surface="greenhouse">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-rose px-4 py-3 rounded-lg bg-rose/15" role="alert">
            {error}
          </div>
        </div>
      </AppShell>
    )
  }

  if (!session || !attempts) {
    return (
      <AppShell surface="greenhouse">
        <Loader message="Chargement de la session…" size="lg" variant="page" />
      </AppShell>
    )
  }

  const title = child ? `Session · ${child.display_name}` : "Session"

  return (
    <AppShell
      surface="greenhouse"
      topBar={
        <TopBar
          leading={
            <TopBarBack
              to={backTo}
              label="Historique"
              data-testid="session-review-back"
            />
          }
          title={title}
        />
      }
    >
      <Page maxWidth="xl">
        <Card className="p-6 md:p-8">
        <div className="flex items-baseline justify-between gap-3 mb-5">
          <div>
            <Heading level={2}>
              {MODE_LABELS[session.mode] || session.mode}
            </Heading>
            <div className="text-sm text-stem mt-1 font-mono tabular-nums">
              {formatDateTime(session.started_at)}
              {duration != null ? ` · ${formatDuration(duration)}` : ""}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {session.mode === "diagnostic" && (
              <button
                type="button"
                onClick={() => downloadDiagnosticPdf(session.id)}
                className="p-2 rounded-md text-stem hover:text-bark hover:bg-sage-leaf/40 transition-colors cursor-pointer"
                title="Exporter le test de niveau (PDF)"
                aria-label="Exporter le test de niveau PDF"
                data-testid="session-review-diagnostic-pdf"
              >
                <Icon name="download" size={18} />
              </button>
            )}
            {totals && (
              <div className="text-right pl-1">
                <div
                  className={`font-mono tabular-nums text-3xl font-semibold ${
                    totals.pct >= 80
                      ? "text-sage-deep"
                      : totals.pct >= 40
                        ? "text-honey"
                        : "text-rose"
                  }`}
                >
                  {totals.pct}%
                </div>
                <div className="text-xs text-stem font-mono tabular-nums">
                  {totals.correct} / {totals.total} correctes
                </div>
              </div>
            )}
          </div>
        </div>

        {session.mode === "diagnostic" && (
          <Link
            to={`/history/diagnostic/${session.id}${fromParent ? "?from=parent" : ""}`}
            className="inline-flex items-center gap-1.5 text-sky-deep hover:text-sage-deep text-sm mb-5"
            data-testid="open-diagnostic-verdict"
          >
            <Icon name="flag" size={14} /> Voir le verdict complet du test de niveau
          </Link>
        )}

        {attempts.length === 0 ? (
          <p className="italic text-center py-8 text-stem">Aucune question enregistrée.</p>
        ) : (
          <div data-testid="attempts-list">
            {attempts.map((a, i) => (
              <AttemptRow key={a.id} attempt={a} index={i} />
            ))}
          </div>
        )}
      </Card>
      </Page>
    </AppShell>
  )
}
