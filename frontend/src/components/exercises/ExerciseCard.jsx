import { useEffect, useRef } from "react"
import Icon from "../ui/Icon"
import Button from "../ui/Button"
import Card from "../ui/Card"
import Loader from "../ui/Loader"
import HintPanel from "./HintPanel"
import FeedbackMessage from "./FeedbackMessage"
import NumberInput from "./inputs/NumberInput"
import McqInput from "./inputs/McqInput"
import McqMultiInput from "./inputs/McqMultiInput"
import SymbolInput from "./inputs/SymbolInput"
import BinaryEqualityInput from "./inputs/BinaryEqualityInput"
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
    case "mcq_multi":
      return <McqMultiInput key={key} {...props} />
    case "symbol":
      return <SymbolInput key={key} {...props} />
    case "binary_equality":
      return <BinaryEqualityInput key={key} {...props} />
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

      {!feedback && mode !== "diagnostic" && !examMode && <HintPanel exercise={exercise} />}

      {!feedback &&
        renderInput(exercise.input_type, exercise.template_id, {
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
