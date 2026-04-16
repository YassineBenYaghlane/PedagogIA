import { useEffect, useRef } from "react"
import Icon from "../ui/Icon"
import Button from "../ui/Button"
import Card from "../ui/Card"
import { LatinLabel } from "../ui/Heading"
import HintPanel from "./HintPanel"
import FeedbackMessage from "./FeedbackMessage"
import NumberLine from "./visuals/NumberLine"
import DotArray from "./visuals/DotArray"
import NumberInput from "./inputs/NumberInput"
import McqInput from "./inputs/McqInput"
import SymbolInput from "./inputs/SymbolInput"
import DecompositionInput from "./inputs/DecompositionInput"
import PointOnLineInput from "./inputs/PointOnLineInput"
import DragOrderInput from "./inputs/DragOrderInput"

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

const VISUAL_GRADES = new Set(["P1", "P2", "P3"])

const isSmallSkill = (skillId) => {
  if (!skillId) return false
  return /_(5|10|20)$/.test(skillId) || skillId.startsWith("num_compter")
}

const chooseVisual = (grade, skillId, paramsValue) => {
  if (!VISUAL_GRADES.has(grade)) return null
  if (!skillId) return null
  if (skillId.startsWith("num_compter") && typeof paramsValue === "number") {
    return { kind: "dots", count: paramsValue }
  }
  if (isSmallSkill(skillId) && (skillId.includes("add") || skillId.includes("soustr"))) {
    return { kind: "line", max: 20 }
  }
  return null
}

const firstNumericParam = (params) => {
  if (!params) return null
  for (const v of Object.values(params)) {
    if (typeof v === "number") return v
  }
  return null
}

export default function ExerciseCard({
  exercise, skill, grade, feedback, onSubmit, onNext, busy,
  explanation, explaining, onExplain,
}) {
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

  const visual = chooseVisual(grade, skill?.id, firstNumericParam(exercise?.params))
  const disabled = !!feedback || busy

  return (
    <Card className="p-8 md:p-10 w-full max-w-md text-center">
      {skill && (
        <>
          <LatinLabel>{skill.grade}</LatinLabel>
          <p className="font-display text-sm text-bark mt-0.5 mb-5">{skill.label}</p>
        </>
      )}
      <div className="font-mono text-4xl md:text-5xl font-semibold text-bark mb-5 tabular-nums tracking-tight">
        {exercise.prompt}
      </div>

      {visual?.kind === "line" && <NumberLine max={visual.max} />}
      {visual?.kind === "dots" && <DotArray count={visual.count} />}

      {!feedback &&
        renderInput(exercise.input_type, {
          key: exercise.template_id,
          exercise,
          grade,
          disabled,
          onSubmit,
        })}

      {!feedback && <HintPanel exercise={exercise} />}

      <FeedbackMessage
        feedback={feedback}
        explanation={explanation}
        explaining={explaining}
        onExplain={onExplain}
      />

      {feedback && (
        <Button ref={nextRef} onClick={onNext} size="lg" className="w-full mt-4">
          Suivant <Icon name="arrow_forward" />
        </Button>
      )}
    </Card>
  )
}
