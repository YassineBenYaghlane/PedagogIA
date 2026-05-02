import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router"
import AppShell from "../layout/AppShell"
import TopBar from "../layout/TopBar"
import { TopBarBack } from "../layout/TopBarActions"
import { Heading } from "../ui/Heading"
import Loader from "../ui/Loader"
import Card from "../ui/Card"
import ChatPanel from "../chat/ChatPanel"
import { chatApi } from "../../api/chat"
import { useAuthStore } from "../../stores/authStore"

function fmtDate(iso) {
  if (!iso) return ""
  return new Date(iso).toLocaleString("fr-BE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  })
}

export default function ParentChatScreen() {
  const { studentId } = useParams()
  const navigate = useNavigate()
  const { children } = useAuthStore()
  const child = children.find((c) => c.id === studentId)
  const [list, setList] = useState({ loading: true, items: [], error: null })
  const [active, setActive] = useState({ id: null, loading: false, messages: [], error: null })

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const items = await chatApi.list(studentId)
        if (cancelled) return
        setList({ loading: false, items, error: null })
        if (items.length > 0) await openConv(items[0].id)
      } catch (err) {
        if (!cancelled) setList({ loading: false, items: [], error: err.message })
      }
    }
    async function openConv(id) {
      setActive({ id, loading: true, messages: [], error: null })
      try {
        const conv = await chatApi.get(id)
        if (!cancelled) setActive({ id, loading: false, messages: conv.messages || [], error: null })
      } catch (err) {
        if (!cancelled) setActive({ id, loading: false, messages: [], error: err.message })
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [studentId])

  const openConv = async (id) => {
    setActive({ id, loading: true, messages: [], error: null })
    try {
      const conv = await chatApi.get(id)
      setActive({ id, loading: false, messages: conv.messages || [], error: null })
    } catch (err) {
      setActive({ id, loading: false, messages: [], error: err.message })
    }
  }

  return (
    <AppShell
      surface="paper"
      topBar={
        <TopBar
          leading={
            <TopBarBack onClick={() => navigate("/dashboard")} label="Tableau de bord" />
          }
          title={child ? `Conversations · ${child.display_name}` : "Conversations"}
        />
      }
    >
      <div className="flex-1 flex flex-col px-4 sm:px-6 py-4 sm:py-6 max-w-5xl w-full mx-auto">
        <header className="mb-4">
          <Heading level={3} className="text-sage-deep">
            {child ? `Échanges de ${child.display_name}` : "Échanges"}
          </Heading>
          <p className="text-stem text-sm mt-1">
            Lecture seule. Vous voyez ici tout ce que votre enfant a échangé avec son
            tuteur.
          </p>
        </header>
        {list.loading && (
          <div className="py-10">
            <Loader message="Chargement…" />
          </div>
        )}
        {list.error && <Card className="p-4 text-rose">{list.error}</Card>}
        {!list.loading && !list.error && (
          <div className="flex flex-col md:flex-row gap-4 md:h-[68vh]">
            <aside className="md:w-72 md:shrink-0 bg-bone rounded-2xl border border-sage/15 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {list.items.length === 0 && (
                  <p className="text-center text-xs text-stem py-4">
                    Pas encore de conversation.
                  </p>
                )}
                {list.items.map((c) => {
                  const isActive = c.id === active.id
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => openConv(c.id)}
                      className={`w-full text-left rounded-xl px-3 py-2 text-sm transition-colors duration-200 cursor-pointer ${
                        isActive
                          ? "bg-sage-leaf/40 border border-sage/30"
                          : "hover:bg-mist border border-transparent"
                      }`}
                    >
                      <div className="font-medium text-bark truncate">
                        {c.title || "Conversation"}
                      </div>
                      <div className="text-[11px] text-stem mt-0.5 flex justify-between gap-2">
                        <span>{c.message_count || 0} messages</span>
                        <span>{fmtDate(c.last_message_at)}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </aside>
            <div className="flex-1 min-h-[55vh]">
              {active.id ? (
                <ChatPanel
                  messages={active.messages}
                  streamingText=""
                  sending={false}
                  loading={active.loading}
                  error={active.error}
                  readOnly
                  emptyHint="Aucun message dans cette conversation."
                  voice={child?.tutor_voice || "female"}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-stem text-center px-4 bg-chalk rounded-2xl border border-sage/15">
                  Sélectionnez une conversation à gauche.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
