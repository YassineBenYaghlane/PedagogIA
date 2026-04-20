import { useEffect, useState } from "react"
import Icon from "../ui/Icon"
import Button from "../ui/Button"
import { useFeedback } from "../../lib/feedback"

function StrategyTabs({ strategies }) {
  const [active, setActive] = useState(0)
  if (!strategies || strategies.length === 0) return null
  const current = strategies[active]
  return (
    <div
      className="mt-4 rounded-xl p-4 text-left bg-paper border border-bark/5"
      data-testid="strategies"
    >
      <div className="flex flex-wrap gap-2 mb-3">
        {strategies.map((s, i) => (
          <button
            key={s.name}
            onClick={() => setActive(i)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors cursor-pointer ${
              i === active
                ? "bg-sky-deep text-white"
                : "bg-mist text-stem hover:bg-sage-pale/60"
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>
      <p className="text-sm text-bark">{current.explanation}</p>
    </div>
  )
}

function ExplainSection({ feedback, explanation, explaining, onExplain }) {
  if (!feedback?.can_explain) return null

  if (explaining) {
    return (
      <div
        className="mt-4 flex items-center justify-center gap-2 text-sm text-sky-deep"
        data-testid="explain-loading"
      >
        <Icon name="progress_activity" className="animate-spin" />
        Le jardinier observe ta plante…
      </div>
    )
  }

  if (explanation) {
    return (
      <div className="mt-4" data-testid="explanation">
        {explanation.message && (
          <p className="text-sm text-bark text-center">{explanation.message}</p>
        )}
        {explanation.next_skill_id && (
          <p className="text-xs text-stem text-center mt-2">
            On va revoir :{" "}
            <span className="font-mono text-bark">{explanation.next_skill_id}</span>
          </p>
        )}
        <StrategyTabs strategies={explanation.strategies} />
      </div>
    )
  }

  return (
    <Button variant="ghost" size="sm" onClick={onExplain} className="mt-4 w-full" data-testid="explain-btn">
      <Icon name="lightbulb" /> Expliquer mon erreur
    </Button>
  )
}

export default function FeedbackMessage({ feedback, explanation, explaining, onExplain, neutral }) {
  const ok = feedback?.is_correct
  const cues = useFeedback()
  useEffect(() => {
    if (!feedback || neutral) return
    if (ok) cues.correct()
    else cues.wrong()
  }, [feedback, ok, neutral, cues])
  if (!feedback) return null

  if (neutral) {
    return (
      <div className="mt-6 rounded-xl p-5 bg-mist border border-bark/5 text-center">
        <div className="font-display text-lg text-bark">{feedback.message}</div>
      </div>
    )
  }

  return (
    <div
      className={`mt-6 rounded-xl p-5 ${
        ok
          ? "bg-sage-pale/50 border border-sage/20"
          : "bg-rose-soft/60 border border-rose/30"
      }`}
    >
      <div
        className={`w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center ${
          ok ? "bg-sage/15 text-sage-deep" : "bg-rose/20 text-rose"
        }`}
      >
        <Icon name={ok ? "check_circle" : "cancel"} size={32} fill />
      </div>
      <div
        className={`font-display text-xl font-semibold text-center ${
          ok ? "text-sage-deep" : "text-bark"
        }`}
      >
        {ok ? "Bravo !" : "Pas tout à fait"}
      </div>
      {feedback.message && (
        <p className="text-stem text-center mt-2 text-sm">{feedback.message}</p>
      )}
      <ExplainSection
        feedback={feedback}
        explanation={explanation}
        explaining={explaining}
        onExplain={onExplain}
      />
    </div>
  )
}
