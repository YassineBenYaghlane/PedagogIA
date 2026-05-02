import Icon from "../ui/Icon"


function fmtDate(iso) {
  if (!iso) return ""
  return new Date(iso).toLocaleDateString("fr-BE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  })
}

export default function ConversationList({
  conversations,
  currentId,
  onSelect,
  onCreate,
  onDelete,
  loading
}) {
  const handleDelete = (e, conv) => {
    e.stopPropagation()
    if (!onDelete) return
    const label = conv.title || "cette conversation"
    if (window.confirm(`Supprimer « ${label} » ? Cette action est définitive.`)) {
      onDelete(conv.id)
    }
  }
  return (
    <aside className="flex flex-col h-full bg-bone rounded-2xl border border-sage/15 overflow-hidden">
      <div className="p-3 border-b border-sage/15">
        <button
          type="button"
          onClick={onCreate}
          data-testid="chat-new"
          className="w-full flex items-center justify-center gap-2 rounded-xl px-3 py-2 bg-sage-deep text-bone text-sm hover:bg-sage-deep/90 transition-colors duration-200 cursor-pointer"
        >
          <Icon name="add" size={16} />
          Nouvelle conversation
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1" data-testid="chat-list">
        {loading && (
          <p className="text-center text-xs text-stem py-4">Chargement…</p>
        )}
        {!loading && conversations.length === 0 && (
          <p className="text-center text-xs text-stem py-4">
            Aucune conversation pour le moment.
          </p>
        )}
        {conversations.map((c) => {
          const active = c.id === currentId
          return (
            <div
              key={c.id}
              data-testid={`chat-item-${c.id}`}
              className={`group relative rounded-xl text-sm transition-colors duration-200 ${
                active
                  ? "bg-sage-leaf/40 border border-sage/30"
                  : "hover:bg-mist border border-transparent"
              }`}
            >
              <button
                type="button"
                onClick={() => onSelect(c.id)}
                className="w-full text-left px-3 py-2 pr-9 cursor-pointer"
              >
                <div className="font-medium text-bark truncate">
                  {c.title || "Conversation"}
                </div>
                <div className="text-[11px] text-stem mt-0.5 flex justify-between gap-2">
                  <span>{c.message_count || 0} messages</span>
                  <span>{fmtDate(c.last_message_at)}</span>
                </div>
              </button>
              {onDelete && (
                <button
                  type="button"
                  onClick={(e) => handleDelete(e, c)}
                  data-testid={`chat-delete-${c.id}`}
                  aria-label="Supprimer cette conversation"
                  className="absolute top-1.5 right-1.5 w-7 h-7 rounded-lg flex items-center justify-center text-stem hover:text-rose hover:bg-rose-soft/60 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-200 cursor-pointer"
                >
                  <Icon name="delete" size={16} />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </aside>
  )
}
