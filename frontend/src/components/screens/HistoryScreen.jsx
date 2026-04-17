import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router"
import Icon from "../ui/Icon"
import Button from "../ui/Button"
import Card from "../ui/Card"
import { Heading, LatinLabel } from "../ui/Heading"
import { useAuthStore } from "../../stores/authStore"
import {
  fetchSessionSummaries,
  downloadStudentExport,
  downloadDiagnosticPdf,
} from "../../api/history"
import { downloadSessionExport } from "../../api/sessions"

const MODE_LABELS = {
  learn: "Entraînement",
  diagnostic: "Diagnostic",
  drill: "Automatismes",
  exam: "Examen",
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

function SessionRow({ row, onOpen }) {
  const pct = Math.round((row.accuracy || 0) * 100)
  const tone = pct >= 80 ? "text-sage-deep" : pct >= 40 ? "text-honey" : "text-rose"
  const isDiagnostic = row.mode === "diagnostic"
  return (
    <button
      type="button"
      onClick={() => onOpen(row)}
      className="w-full text-left flex items-center justify-between py-3 border-b border-sage/10 last:border-0 gap-3 hover:bg-mist/60 rounded-md px-2 -mx-2 transition-colors cursor-pointer"
      data-testid={isDiagnostic ? "history-row-diagnostic" : "history-row"}
    >
      <div className="min-w-0 flex-1">
        <div className="font-display font-semibold text-bark">
          {MODE_LABELS[row.mode] || row.mode}
        </div>
        <div className="text-xs text-stem font-mono tabular-nums">
          {formatDate(row.started_at)} · {formatTime(row.started_at)} ·{" "}
          {formatDuration(row.duration_seconds)}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {isDiagnostic && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              downloadDiagnosticPdf(row.id)
            }}
            className="p-2 rounded-md text-stem hover:text-bark hover:bg-sage-leaf/40 transition-colors cursor-pointer"
            title="Exporter le diagnostic (PDF)"
            aria-label="Exporter le diagnostic PDF"
            data-testid="history-row-pdf"
          >
            <Icon name="description" size={18} />
          </button>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            downloadSessionExport(row.id)
          }}
          className="p-2 rounded-md text-stem hover:text-bark hover:bg-sage-leaf/40 transition-colors cursor-pointer"
          title="Exporter la session (JSON)"
          aria-label="Exporter la session"
          data-testid="history-row-export"
        >
          <Icon name="download" size={18} />
        </button>
        <div className="text-right w-32">
          <div className={`font-mono tabular-nums font-semibold ${tone}`}>
            {row.total_attempts ? `${pct}%` : "—"}
          </div>
          <div className="text-xs text-stem font-mono tabular-nums">
            {row.correct}/{row.total_attempts} · {row.skills_touched} compétences
          </div>
        </div>
      </div>
    </button>
  )
}

export default function HistoryScreen() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const fromParent = searchParams.get("from") === "parent"
  const backTo = fromParent ? "/dashboard" : "/"
  const backLabel = fromParent ? "Espace parent" : "Retour"
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
          onClick={() => navigate(backTo)}
          className="text-stem hover:text-bark flex items-center gap-1.5 cursor-pointer text-sm"
          data-testid="history-back"
        >
          <Icon name="arrow_back" size={16} /> {backLabel}
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
              <SessionRow
                key={row.id}
                row={row}
                onOpen={(r) =>
                  navigate(
                    `/history/session/${r.id}${fromParent ? "?from=parent" : ""}`
                  )
                }
              />
            ))}
          </Card>
        )}
      </Card>
    </div>
  )
}
