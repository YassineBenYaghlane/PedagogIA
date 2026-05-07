import { useState } from "react"

export default function AtelierPdfPageJump({ pageNumber, totalPages, onJump }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState("")

  const startEditing = () => {
    setDraft(String(pageNumber))
    setEditing(true)
  }

  const commit = () => {
    const n = parseInt(draft, 10)
    if (Number.isFinite(n) && n >= 1 && n <= totalPages && n !== pageNumber) {
      onJump(n)
    }
    setEditing(false)
  }

  return (
    <span data-testid="pdf-page-label" className="font-mono text-sm text-stem inline-flex items-center whitespace-nowrap">
      <span className="hidden sm:inline">Page </span>
      {editing ? (
        <input
          autoFocus
          type="number"
          min={1}
          max={totalPages}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={(e) => e.currentTarget.select()}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit()
            else if (e.key === "Escape") setEditing(false)
          }}
          onBlur={commit}
          aria-label="Numéro de page"
          data-testid="pdf-page-input"
          className="w-14 text-center bg-bone rounded px-1 py-0.5 border border-sage-deep/40 focus:outline-none focus:ring-2 focus:ring-sage-deep/30 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          style={{ MozAppearance: "textfield" }}
        />
      ) : (
        <button
          type="button"
          onClick={startEditing}
          aria-label={`Aller à une page (sur ${totalPages})`}
          data-testid="pdf-page-jump"
          className="rounded px-1.5 py-0.5 hover:bg-sage-leaf/40 hover:text-bark transition-colors cursor-pointer"
        >
          {pageNumber}
        </button>
      )}
      <span> / {totalPages}</span>
    </span>
  )
}
