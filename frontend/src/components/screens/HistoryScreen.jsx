import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import Icon from "../ui/Icon"
import Button from "../ui/Button"
import Card from "../ui/Card"
import { Heading, LatinLabel } from "../ui/Heading"
import { useAuthStore } from "../../stores/authStore"
import { fetchSessionSummaries, downloadStudentExport } from "../../api/history"

const MODE_LABELS = {
  learn: "Entraînement",
  diagnostic: "Diagnostic",
  drill: "Automatismes",
}

function formatDate(iso) {
  if (!iso) return "—"
  const d = new Date(iso)
  return d.toLocaleDateString("fr-BE", { day: "2-digit", month: "short", year: "numeric" })
}

function formatTime(iso) {
  if (!iso) return ""
  const d = new Date(iso)
  return d.toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" })
}

function formatDuration(seconds) {
  if (!seconds) return "—"
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m === 0) return `${s}s`
  return `${m}m ${s.toString().padStart(2, "0")}s`
}

function SessionRow({ row }) {
  const pct = Math.round((row.accuracy || 0) * 100)
  const tone = pct >= 80 ? "text-sage-deep" : pct >= 40 ? "text-honey" : "text-rose"
  return (
    <div className="flex items-center justify-between py-3 border-b border-sage/10 last:border-0 gap-3">
      <div className="min-w-0 flex-1">
        <div className="font-display font-semibold text-bark">
          {MODE_LABELS[row.mode] || row.mode}
        </div>
        <div className="text-xs text-stem font-mono tabular-nums">
          {formatDate(row.started_at)} · {formatTime(row.started_at)} ·{" "}
          {formatDuration(row.duration_seconds)}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className={`font-mono tabular-nums font-semibold ${tone}`}>
          {row.total_attempts ? `${pct}%` : "—"}
        </div>
        <div className="text-xs text-stem font-mono tabular-nums">
          {row.correct}/{row.total_attempts} · {row.skills_touched} compétences
        </div>
      </div>
    </div>
  )
}

export default function HistoryScreen() {
  const navigate = useNavigate()
  const { selectedChildId, children } = useAuthStore()
  const child = children.find((c) => c.id === selectedChildId)
  const [rows, setRows] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!selectedChildId) {
      navigate("/children")
      return
    }
    let cancelled = false
    fetchSessionSummaries(selectedChildId)
      .then((data) => {
        if (!cancelled) setRows(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Erreur")
      })
    return () => {
      cancelled = true
    }
  }, [selectedChildId, navigate])

  return (
    <div className="min-h-screen greenhouse flex flex-col items-center p-6">
      <div className="w-full max-w-2xl mb-4 flex justify-between items-center">
        <button
          onClick={() => navigate("/")}
          className="text-stem hover:text-bark flex items-center gap-1.5 cursor-pointer text-sm"
        >
          <Icon name="arrow_back" size={16} /> Retour
        </button>
        {child && (
          <div className="text-right">
            <LatinLabel>Memoria</LatinLabel>
            <div className="text-sm text-bark font-semibold">
              Historique · {child.display_name}
            </div>
          </div>
        )}
      </div>

      <Card className="p-6 md:p-8 max-w-2xl w-full my-4">
        <Heading level={2}>Historique des sessions</Heading>

        <div className="flex gap-2 my-5" data-testid="history-exports">
          <Button
            variant="outline"
            onClick={() => downloadStudentExport(selectedChildId, "pdf")}
            disabled={!selectedChildId}
            data-testid="export-pdf"
          >
            <Icon name="download" /> Exporter PDF
          </Button>
          <Button
            variant="outline"
            onClick={() => downloadStudentExport(selectedChildId, "json")}
            disabled={!selectedChildId}
            data-testid="export-json"
          >
            <Icon name="download" /> Exporter JSON
          </Button>
        </div>

        {error && (
          <div className="text-rose px-3 py-2 rounded-lg bg-rose/15 mb-4">{error}</div>
        )}

        {rows === null && !error && (
          <div className="text-stem text-sm">Chargement…</div>
        )}

        {rows && rows.length === 0 && (
          <div className="text-center py-10 text-stem" data-testid="history-empty">
            <div className="font-display text-lg mb-1">Aucune session pour l’instant</div>
            <div className="text-sm">Commence par un diagnostic ou un entraînement.</div>
          </div>
        )}

        {rows && rows.length > 0 && (
          <Card className="px-4" data-testid="history-list">
            {rows.map((row) => (
              <SessionRow key={row.id} row={row} />
            ))}
          </Card>
        )}
      </Card>
    </div>
  )
}
