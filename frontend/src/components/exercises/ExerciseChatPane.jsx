import ChatPanel from "../chat/ChatPanel"
import { useChatStore } from "../../stores/chatStore"

export default function ExerciseChatPane({ onClose, onRetry, onNext }) {
  const chat = useChatStore()
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
      />
    </div>
  )
}
