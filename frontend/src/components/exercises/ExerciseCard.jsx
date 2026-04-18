import { useEffect, useRef } from "react"
import Icon from "../ui/Icon"
import Button from "../ui/Button"
import Card from "../ui/Card"
import { LatinLabel } from "../ui/Heading"
import HintPanel from "./HintPanel"
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

function renderInput(inputType, props) {
  switch (inputType) {
    case "mcq":
      return <McqInput {...props} />
    case "symbol":
      return <SymbolInput {...props} />
    case "decomposition":
      return <DecompositionInput {...props} />
    case "point_on_line":
      return <PointOnLineInput {...props} />
    case "drag_order":
      return <DragOrderInput {...props} />
    case "number":
    default:
      return <NumberInput {...props} />
  }
}

export default function ExerciseCard({
  exercise, skill, grade, feedback, onSubmit, onNext, busy,
  explanation, explaining, onExplain, mode,
}) {
  const examMode = mode === "exam"
  const nextRef = useRef(null)

  useEffect(() => {
    if (feedback && nextRef.current) nextRef.current.focus()
  }, [feedback])

  if (!exercise) {
    return (
      <Card className="p-8 w-full max-w-md text-center">
        <span className="latin text-stem">Germinatio…</span>
      </Card>
    )
  }

  const disabled = !!feedback || busy
  const prompt = bindTrailingPunctuation(exercise.prompt)

  return (
    <Card className="p-8 md:p-10 w-full max-w-md text-center">
      {skill && (
        <>
          <LatinLabel>{skill.grade}</LatinLabel>
          <p className="font-display text-sm text-bark mt-0.5 mb-5">{skill.label}</p>
        </>
      )}
      <div className="font-mono text-3xl sm:text-4xl md:text-5xl font-semibold text-bark mb-5 tabular-nums tracking-tight text-balance break-words">
        {prompt}
      </div>

      {!feedback && mode !== "diagnostic" && !examMode && <HintPanel exercise={exercise} />}

      {!feedback &&
        renderInput(exercise.input_type, {
          key: exercise.template_id,
          exercise,
          grade,
          disabled,
          onSubmit,
        })}

      <FeedbackMessage
        feedback={feedback}
        explanation={explanation}
        explaining={explaining}
        onExplain={onExplain}
        neutral={examMode}
      />

      {feedback && (
        <Button ref={nextRef} onClick={onNext} size="lg" className="w-full mt-4">
          Suivant <Icon name="arrow_forward" />
        </Button>
      )}
    </Card>
  )
}
