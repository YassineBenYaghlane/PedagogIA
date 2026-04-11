import { useState, useRef, useEffect } from "react"
import Icon from "../ui/Icon"
import { opGradients, opIcons, opLabels, levelColors } from "../../lib/constants"
import { formatNumber } from "../../lib/utils"
import { generateExplanation } from "../../lib/explanations"

export default function QuestionScreen({ question, index, total, onAnswer }) {
  const [input, setInput] = useState("")
  const [feedback, setFeedback] = useState(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const nextBtnRef = useRef(null)
  const gradient = opGradients[question.operation]

  useEffect(() => {
    if (feedback && nextBtnRef.current) {
      nextBtnRef.current.focus()
    }
  }, [feedback])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (input.trim() === "" || feedback) return
    const cleaned = input.replace(",", ".")
    const userAnswer = parseFloat(cleaned)
    if (isNaN(userAnswer)) return
    const isCorrect = Math.abs(userAnswer - question.answer) < 0.001
    setFeedback({ isCorrect, correctAnswer: question.answer })
  }

  const handleNext = () => {
    onAnswer(feedback.isCorrect)
  }

  const progressPercent = ((index + 1) / total) * 100

  return (
    <div className="min-h-screen bg-background font-body text-on-surface flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="bg-orb absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 opacity-50" />
      <div className="bg-orb absolute top-[60%] -right-[5%] w-[30%] h-[30%] bg-secondary-container/20 opacity-50" />

      <div className="w-full max-w-md mb-8 relative z-10">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-headline font-semibold text-on-surface-variant">
            Question {index + 1} / {total}
          </span>
          <span className={`text-xs font-headline font-bold px-3 py-1.5 rounded-full ${levelColors[question.level]} flex items-center gap-1.5`}>
            <Icon name={opIcons[question.operation]} className="text-sm" />
            {opLabels[question.operation]} — {question.level}
          </span>
        </div>
        <div className="w-full bg-surface-container rounded-full h-4 overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${gradient} rounded-full transition-all duration-500`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-ambient p-8 md:p-12 w-full max-w-md text-center ghost-border relative z-10">
        <div className={`w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
          <Icon name={opIcons[question.operation]} fill className="text-2xl text-white" />
        </div>

        <div className="font-headline text-4xl md:text-5xl font-extrabold text-on-surface mb-8 tracking-tight">
          {question.text} = ?
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            inputMode="decimal"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!!feedback}
            autoFocus
            placeholder="Ta réponse..."
            className="w-full text-center font-headline text-3xl font-bold p-4 rounded-xl
              bg-surface-container-low text-on-surface
              border border-transparent
              focus:bg-surface-container-lowest focus:border-primary/15 focus:shadow-[0_0_0_3px_rgba(0,89,182,0.1)]
              outline-none transition-all duration-300
              disabled:opacity-60 placeholder:text-outline-variant"
          />

          {!feedback && (
            <button
              type="submit"
              className="gradient-soul text-on-primary font-headline font-bold text-xl w-full mt-5 py-4 rounded-xl
                shadow-[0_12px_24px_rgba(0,89,182,0.3)] spring-hover cursor-pointer flex items-center justify-center gap-2"
            >
              Valider
              <Icon name="check" />
            </button>
          )}
        </form>

        {feedback && (
          <div className="mt-6">
            {feedback.isCorrect ? (
              <div className="bg-tertiary-container/20 rounded-xl p-5">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-tertiary/10 flex items-center justify-center">
                  <Icon name="check_circle" fill className="text-5xl text-tertiary" />
                </div>
                <div className="text-2xl font-headline font-bold text-tertiary">Bravo !</div>
              </div>
            ) : (
              <div className="bg-error-container/10 rounded-xl p-5">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-error/10 flex items-center justify-center">
                  <Icon name="cancel" fill className="text-5xl text-error" />
                </div>
                <div className="text-2xl font-headline font-bold text-error mb-1">Pas tout à fait...</div>
                <div className="text-lg text-on-surface-variant">
                  La bonne réponse : <span className="font-bold text-error">{formatNumber(feedback.correctAnswer)}</span>
                </div>
              </div>
            )}

            {!feedback.isCorrect && !showExplanation && (
              <button
                onClick={() => setShowExplanation(true)}
                className="bg-secondary-container/30 hover:bg-secondary-container/50 text-on-secondary-container font-headline font-bold text-lg w-full mt-4 py-3 rounded-xl
                  transition-all duration-300 cursor-pointer flex items-center justify-center gap-2"
              >
                <Icon name="lightbulb" className="text-secondary" />
                Explication
              </button>
            )}

            {showExplanation && (
              <div className="mt-4 bg-surface-container-low rounded-xl p-5 text-left overflow-x-auto ghost-border">
                <p className="font-headline font-bold text-secondary mb-3 flex items-center gap-2">
                  <Icon name="lightbulb" fill className="text-secondary" />
                  Comment résoudre :
                </p>
                <pre className="text-on-surface-variant font-mono text-sm leading-relaxed whitespace-pre">
{generateExplanation(question)}
                </pre>
              </div>
            )}

            <button
              ref={nextBtnRef}
              onClick={handleNext}
              className="gradient-soul text-on-primary font-headline font-bold text-xl w-full mt-4 py-4 rounded-xl
                shadow-[0_12px_24px_rgba(0,89,182,0.3)] spring-hover cursor-pointer flex items-center justify-center gap-2"
            >
              {index + 1 < total ? (
                <>Suivante <Icon name="arrow_forward" /></>
              ) : (
                <>Voir mon diagnostic <Icon name="insights" /></>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
