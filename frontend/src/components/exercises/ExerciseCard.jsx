import { useState, useEffect, useRef } from "react"
import Icon from "../ui/Icon"
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
  explanation, explaining, onExplain
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
    return <div className="text-center text-on-surface-variant">Chargement…</div>
  }

  const visual = chooseVisual(grade, skill?.id, firstNumericParam(exercise?.params))

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-ambient p-8 md:p-12 w-full max-w-md text-center ghost-border relative z-10">
      {skill && (
        <p className="text-xs uppercase tracking-wide font-headline font-bold text-on-surface-variant mb-2">
          {skill.label} · {skill.grade}
        </p>
      )}
      <div className="font-headline text-3xl md:text-4xl font-extrabold text-on-surface mb-4 tracking-tight">
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
          placeholder={useNumPad ? "" : "Ta réponse..."}
          className="w-full text-center font-headline text-3xl font-bold p-4 rounded-xl bg-surface-container-low text-on-surface border border-transparent focus:bg-surface-container-lowest focus:border-primary/15 focus:shadow-[0_0_0_3px_rgba(0,89,182,0.1)] outline-none transition-all duration-300 disabled:opacity-60 placeholder:text-outline-variant"
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
            <button
              type="submit"
              disabled={busy}
              className="gradient-soul text-on-primary font-headline font-bold text-xl w-full mt-5 py-4 rounded-xl shadow-[0_12px_24px_rgba(0,89,182,0.3)] spring-hover cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
            >
              Valider <Icon name="check" />
            </button>
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
        <button
          ref={nextRef}
          onClick={onNext}
          className="gradient-soul text-on-primary font-headline font-bold text-xl w-full mt-4 py-4 rounded-xl shadow-[0_12px_24px_rgba(0,89,182,0.3)] spring-hover cursor-pointer flex items-center justify-center gap-2"
        >
          Suivant <Icon name="arrow_forward" />
        </button>
      )}
    </div>
  )
}
