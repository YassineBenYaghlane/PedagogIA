import { useState } from "react"
import Icon from "../ui/Icon"

function StrategyTabs({ strategies }) {
  const [active, setActive] = useState(0)
  if (!strategies || strategies.length === 0) return null
  const current = strategies[active]
  return (
    <div className="mt-4 bg-surface-container-lowest rounded-xl p-4 text-left" data-testid="strategies">
      <div className="flex flex-wrap gap-2 mb-3">
        {strategies.map((s, i) => (
          <button
            key={s.name}
            onClick={() => setActive(i)}
            className={`text-xs font-headline font-bold px-3 py-1.5 rounded-full transition-colors cursor-pointer ${
              i === active
                ? "bg-primary text-on-primary"
                : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>
      <p className="text-sm text-on-surface">{current.explanation}</p>
    </div>
  )
}

function ExplainSection({ feedback, explanation, explaining, onExplain }) {
  if (!feedback?.can_explain) return null

  if (explaining) {
    return (
      <div
        className="mt-4 flex items-center justify-center gap-2 text-sm text-on-surface-variant"
        data-testid="explain-loading"
      >
        <Icon name="progress_activity" className="animate-spin text-primary" />
        L'IA analyse ton erreur…
      </div>
    )
  }

  if (explanation) {
    return (
      <div className="mt-4" data-testid="explanation">
        {explanation.message && (
          <p className="text-sm text-on-surface text-center">{explanation.message}</p>
        )}
        {explanation.next_skill_id && (
          <p className="text-xs text-on-surface-variant text-center mt-2">
            On va revoir : <span className="font-mono">{explanation.next_skill_id}</span>
          </p>
        )}
        <StrategyTabs strategies={explanation.strategies} />
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onExplain}
      data-testid="explain-btn"
      className="mt-4 w-full flex items-center justify-center gap-2 bg-surface-container-low hover:bg-surface-container text-on-surface font-headline font-bold py-2.5 rounded-xl cursor-pointer text-sm"
    >
      <Icon name="lightbulb" /> Expliquer mon erreur
    </button>
  )
}

export default function FeedbackMessage({ feedback, explanation, explaining, onExplain }) {
  if (!feedback) return null
  const ok = feedback.is_correct
  return (
    <div className={`mt-6 rounded-xl p-5 ${ok ? "bg-tertiary-container/20" : "bg-error-container/10"}`}>
      <div className={`w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center ${ok ? "bg-tertiary/10" : "bg-error/10"}`}>
        <Icon name={ok ? "check_circle" : "cancel"} fill className={`text-4xl ${ok ? "text-tertiary" : "text-error"}`} />
      </div>
      <div className={`text-xl font-headline font-bold text-center ${ok ? "text-tertiary" : "text-error"}`}>
        {ok ? "Bravo !" : "Pas tout à fait"}
      </div>
      {feedback.message && (
        <p className="text-on-surface-variant text-center mt-2">{feedback.message}</p>
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
