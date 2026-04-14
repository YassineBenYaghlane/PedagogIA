import Icon from "../ui/Icon"

export default function FeedbackMessage({ feedback }) {
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
      {!ok && feedback.next_skill_id && (
        <p className="text-sm text-on-surface-variant text-center mt-3">
          On va revoir : <span className="font-mono">{feedback.next_skill_id}</span>
        </p>
      )}
    </div>
  )
}
