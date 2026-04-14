import { useState, useEffect, useRef } from "react"
import Icon from "../ui/Icon"
import HintPanel from "./HintPanel"
import FeedbackMessage from "./FeedbackMessage"

export default function ExerciseCard({ exercise, skill, feedback, onSubmit, onNext, busy }) {
  const [input, setInput] = useState("")
  const nextRef = useRef(null)

  useEffect(() => {
    if (feedback && nextRef.current) nextRef.current.focus()
  }, [feedback])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!input.trim() || feedback || busy) return
    onSubmit(input.trim())
  }

  if (!exercise) {
    return <div className="text-center text-on-surface-variant">Chargement…</div>
  }

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-ambient p-8 md:p-12 w-full max-w-md text-center ghost-border relative z-10">
      {skill && (
        <p className="text-xs uppercase tracking-wide font-headline font-bold text-on-surface-variant mb-2">
          {skill.label} · {skill.grade}
        </p>
      )}
      <div className="font-headline text-3xl md:text-4xl font-extrabold text-on-surface mb-8 tracking-tight">
        {exercise.prompt}
      </div>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          inputMode="decimal"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={!!feedback || busy}
          autoFocus
          placeholder="Ta réponse..."
          className="w-full text-center font-headline text-3xl font-bold p-4 rounded-xl bg-surface-container-low text-on-surface border border-transparent focus:bg-surface-container-lowest focus:border-primary/15 focus:shadow-[0_0_0_3px_rgba(0,89,182,0.1)] outline-none transition-all duration-300 disabled:opacity-60 placeholder:text-outline-variant"
        />
        {!feedback && (
          <button
            type="submit"
            disabled={busy}
            className="gradient-soul text-on-primary font-headline font-bold text-xl w-full mt-5 py-4 rounded-xl shadow-[0_12px_24px_rgba(0,89,182,0.3)] spring-hover cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
          >
            Valider <Icon name="check" />
          </button>
        )}
      </form>

      {!feedback && <HintPanel exercise={exercise} />}

      <FeedbackMessage feedback={feedback} />

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
