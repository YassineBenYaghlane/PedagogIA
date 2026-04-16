import { useState, useEffect, useRef } from "react"
import Icon from "../ui/Icon"
import Button from "../ui/Button"
import Card from "../ui/Card"
import { LatinLabel } from "../ui/Heading"
import HintPanel from "./HintPanel"
import FeedbackMessage from "./FeedbackMessage"
import NumberPad from "./NumberPad"
import NumberLine from "./visuals/NumberLine"
import DotArray from "./visuals/DotArray"

const NUMPAD_GRADES = new Set(["P1", "P2"])
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
  const [input, setInput] = useState("")
  const nextRef = useRef(null)
  const useNumPad = NUMPAD_GRADES.has(grade)

  useEffect(() => {
    if (feedback && nextRef.current) nextRef.current.focus()
  }, [feedback])

  const submit = () => {
    const v = input.trim()
    if (!v || feedback || busy) return
    onSubmit(v)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    submit()
  }

  if (!exercise) {
    return (
      <Card className="p-8 w-full max-w-md text-center">
        <span className="latin text-stem">Germinatio…</span>
      </Card>
    )
  }

  const visual = chooseVisual(grade, skill?.id, firstNumericParam(exercise?.params))

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

      <form onSubmit={handleSubmit} className="mt-4">
        <input
          type="text"
          inputMode="decimal"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={!!feedback || busy}
          autoFocus={!useNumPad}
          readOnly={useNumPad}
          placeholder={useNumPad ? "" : "Ta réponse…"}
          className="w-full text-center font-mono text-3xl font-semibold p-4 rounded-lg bg-paper text-bark border-2 border-sage/30 focus:border-sage focus:outline-none focus:ring-4 focus:ring-sage-pale/60 transition-all disabled:opacity-60 placeholder:text-twig tabular-nums"
          data-testid="exercise-input"
        />

        {useNumPad ? (
          <NumberPad
            value={input}
            onChange={setInput}
            onSubmit={submit}
            disabled={!!feedback || busy}
          />
        ) : (
          !feedback && (
            <Button
              type="submit"
              disabled={busy}
              size="lg"
              className="w-full mt-5"
            >
              Valider <Icon name="check" />
            </Button>
          )
        )}
      </form>

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
