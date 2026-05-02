import { useEffect } from "react"
import { useNavigate } from "react-router"
import AppShell from "../layout/AppShell"
import TopBar from "../layout/TopBar"
import { TopBarBack } from "../layout/TopBarActions"
import ChatPanel from "../chat/ChatPanel"
import ConversationList from "../chat/ConversationList"
import VoiceToggle from "../chat/VoiceToggle"
import { useAuthStore } from "../../stores/authStore"
import { useChatStore } from "../../stores/chatStore"

export default function ChatScreen() {
  const navigate = useNavigate()
  const { selectedChildId, children } = useAuthStore()
  const child = children.find((c) => c.id === selectedChildId)
  const {
    conversations,
    currentId,
    messages,
    streamingText,
    sending,
    loadingList,
    loadingConversation,
    error,
    loadConversations,
    selectConversation,
    createConversation,
    deleteConversation,
    send,
    reset
  } = useChatStore()

  useEffect(() => {
    if (!selectedChildId) {
      navigate("/children")
      return
    }
    loadConversations(selectedChildId)
    return () => reset()
  }, [selectedChildId, loadConversations, reset, navigate])

  const handleCreate = async () => {
    const conv = await createConversation(selectedChildId)
    if (conv) await selectConversation(conv.id)
  }

  return (
    <AppShell
      surface="paper"
      topBar={
        <TopBar
          leading={<TopBarBack onClick={() => navigate("/")} label="Retour" />}
          title={child ? `Mon tuteur · ${child.display_name}` : "Mon tuteur"}
        />
      }
    >
      <div className="flex-1 flex flex-col md:flex-row gap-4 px-4 sm:px-6 py-4 sm:py-6 max-w-5xl w-full mx-auto">
        <div className="md:w-72 md:shrink-0 md:h-[70vh]">
          <ConversationList
            conversations={conversations}
            currentId={currentId}
            onSelect={selectConversation}
            onCreate={handleCreate}
            onDelete={deleteConversation}
            loading={loadingList}
          />
        </div>
        <div className="flex-1 min-h-[60vh] md:h-[70vh]">
          {currentId ? (
            <ChatPanel
              messages={messages}
              streamingText={streamingText}
              sending={sending}
              loading={loadingConversation}
              error={error}
              onSend={send}
              emptyHint="Pose ta question, on commence."
              voice={child?.tutor_voice || "female"}
              headerExtra={child ? <VoiceToggle child={child} /> : null}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-stem text-center px-4 bg-chalk rounded-2xl border border-sage/15">
              Choisis une conversation à gauche, ou crée-en une nouvelle.
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
