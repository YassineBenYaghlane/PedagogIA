export default function ChatBubble({ role, children, streaming = false }) {
  const isStudent = role === "student"
  const containerCls = isStudent ? "flex justify-end" : "flex justify-start"
  const bubbleCls = isStudent
    ? "bg-sage-leaf/60 border border-sage/25 text-bark"
    : "bg-sky-soft/70 border border-sky/30 text-bark"
  return (
    <div className={containerCls}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${bubbleCls}`}
      >
        {children}
        {streaming && (
          <span className="inline-block ml-1 w-1.5 h-3.5 align-middle bg-sky-deep/60 animate-pulse rounded-sm" />
        )}
      </div>
    </div>
  )
}
