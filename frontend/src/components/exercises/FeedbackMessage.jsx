import { useEffect } from "react"
import Icon from "../ui/Icon"
import Button from "../ui/Button"
import { useFeedback } from "../../lib/feedback"

function ExplainSection({ feedback, conversationId, openingChat, onOpenChat }) {
  if (!feedback?.can_explain) return null

  if (openingChat) {
    return (
      <div
        className="mt-4 flex items-center justify-center gap-2 text-sm text-sky-deep"
        data-testid="explain-loading"
      >
        <Icon name="progress_activity" className="animate-spin" />
        Le tuteur t'écoute…
      </div>
    )
  }

  if (conversationId) return null

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onOpenChat}
      className="mt-4 w-full"
      data-testid="explain-btn"
    >
      <Icon name="chat_bubble" /> Demander de l'aide
    </Button>
  )
}

export default function FeedbackMessage({
  feedback,
  conversationId,
  openingChat,
  onOpenChat,
  neutral
}) {
  const ok = feedback?.is_correct
  const cues = useFeedback()
  useEffect(() => {
    if (!feedback || neutral) return
    if (ok) cues.correct()
    else cues.wrong()
  }, [feedback, ok, neutral, cues])
  if (!feedback) return null

  if (neutral) {
    return (
      <div className="mt-6 rounded-xl p-5 bg-mist border border-bark/5 text-center">
        <div className="font-display text-lg text-bark">{feedback.message}</div>
      </div>
    )
  }

  return (
    <div
      className={`mt-6 rounded-xl p-5 ${
        ok
          ? "bg-sage-pale/50 border border-sage/20"
          : "bg-rose-soft/60 border border-rose/30"
      }`}
    >
      <div
        className={`w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center ${
          ok ? "bg-sage/15 text-sage-deep" : "bg-rose/20 text-rose"
        }`}
      >
        <Icon name={ok ? "check_circle" : "cancel"} size={32} fill />
      </div>
      <div
        className={`font-display text-xl font-semibold text-center ${
          ok ? "text-sage-deep" : "text-bark"
        }`}
      >
        {ok ? "Bravo !" : "Pas tout à fait"}
      </div>
      {feedback.message && (
        <p className="text-stem text-center mt-2 text-sm">{feedback.message}</p>
      )}
      <ExplainSection
        feedback={feedback}
        conversationId={conversationId}
        openingChat={openingChat}
        onOpenChat={onOpenChat}
      />
    </div>
  )
}
