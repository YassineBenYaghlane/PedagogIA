import { useEffect, useRef } from "react"
import Icon from "../ui/Icon"
import Button from "../ui/Button"
import Card from "../ui/Card"
import Loader from "../ui/Loader"
import AskHelpButton from "./AskHelpButton"
import FeedbackMessage from "./FeedbackMessage"
import NumberInput from "./inputs/NumberInput"
import McqInput from "./inputs/McqInput"
import SymbolInput from "./inputs/SymbolInput"
import DecompositionInput from "./inputs/DecompositionInput"
import PointOnLineInput from "./inputs/PointOnLineInput"
import DragOrderInput from "./inputs/DragOrderInput"

function bindTrailingPunctuation(text) {
  if (typeof text !== "string") return text
  return text.replace(/\s+([?!:;])/g, "\u00A0$1")
}

function renderInput(inputType, key, props) {
  switch (inputType) {
    case "mcq":
      return <McqInput key={key} {...props} />
    case "symbol":
      return <SymbolInput key={key} {...props} />
    case "decomposition":
      return <DecompositionInput key={key} {...props} />
    case "point_on_line":
      return <PointOnLineInput key={key} {...props} />
    case "drag_order":
      return <DragOrderInput key={key} {...props} />
    case "number":
    default:
      return <NumberInput key={key} {...props} />
  }
}

export default function ExerciseCard({
  exercise, skill, grade, feedback, onSubmit, onNext, onRetry, busy,
  conversationId, openingChat, onOpenChat, onOpenChatForExercise, mode,
}) {
  const examMode = mode === "exam"
  const nextRef = useRef(null)

  useEffect(() => {
    if (feedback && nextRef.current) nextRef.current.focus()
  }, [feedback])

  if (!exercise) {
    return (
      <Card className="p-8 w-full max-w-md">
        <Loader message="Chargement…" />
      </Card>
    )
  }

  const disabled = !!feedback || busy
  const prompt = bindTrailingPunctuation(exercise.prompt)

  return (
    <Card className="p-8 md:p-10 w-full max-w-md text-center">
      {skill && (
        <>
          <span className="text-xs text-stem uppercase tracking-wider">{skill.grade}</span>
          <p className="font-display text-sm text-bark mt-0.5 mb-5">{skill.label}</p>
        </>
      )}
      <div className="font-mono text-3xl sm:text-4xl md:text-5xl font-semibold text-bark mb-5 tabular-nums tracking-tight text-balance break-words">
        {prompt}
      </div>

      {!feedback && !conversationId && mode !== "diagnostic" && !examMode && (
        <AskHelpButton onClick={onOpenChatForExercise} busy={openingChat} />
      )}

      {!feedback && !conversationId &&
        renderInput(exercise.input_type, exercise.template_id, {
          exercise,
          grade,
          disabled,
          onSubmit,
        })}

      {!feedback && conversationId && (
        <p className="mt-2 text-xs text-stem italic" data-testid="chat-active-note">
          On en parle avec le tuteur juste en dessous.
        </p>
      )}

      <FeedbackMessage
        feedback={feedback}
        conversationId={conversationId}
        openingChat={openingChat}
        onOpenChat={onOpenChat}
        onRetry={onRetry}
        onNext={onNext}
        neutral={examMode}
      />

      {feedback && !conversationId && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
          {!feedback.is_correct && onRetry && (
            <Button
              variant="ghost"
              size="lg"
              onClick={onRetry}
              data-testid="exercise-retry"
            >
              <Icon name="refresh" /> Réessayer
            </Button>
          )}
          <Button
            ref={nextRef}
            onClick={onNext}
            size="lg"
            className={!feedback.is_correct && onRetry ? "" : "sm:col-span-2"}
          >
            Suivant <Icon name="arrow_forward" />
          </Button>
        </div>
      )}
    </Card>
  )
}
