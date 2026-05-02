import ChatPanel from "../chat/ChatPanel"
import { useChatStore } from "../../stores/chatStore"
import { useAuthStore } from "../../stores/authStore"

export default function ExerciseChatPane({ onClose, onRetry, onNext }) {
  const chat = useChatStore()
  const { selectedChildId, children } = useAuthStore()
  const child = children.find((c) => c.id === selectedChildId)
  return (
    <div className="h-full" data-testid="exercise-chat-pane">
      <ChatPanel
        title="Avec le tuteur"
        onClose={onClose}
        messages={chat.messages}
        streamingText={chat.streamingText}
        sending={chat.sending}
        loading={chat.loadingConversation}
        error={chat.error}
        onSend={chat.send}
        onRetry={onRetry}
        onNext={onNext}
        emptyHint="Le tuteur va te poser une question."
        voice={child?.tutor_voice || "female"}
        studentId={selectedChildId}
      />
    </div>
  )
}
