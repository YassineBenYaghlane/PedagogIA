import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router"
import AppShell from "../layout/AppShell"
import Page from "../layout/Page"
import TopBar from "../layout/TopBar"
import { TopBarBack } from "../layout/TopBarActions"
import Icon from "../ui/Icon"
import Button from "../ui/Button"
import Card from "../ui/Card"
import EmptyState from "../ui/EmptyState"
import { Heading } from "../ui/Heading"
import { useAuthStore } from "../../stores/authStore"
import {
  fetchSessionSummaries,
  downloadStudentExport,
} from "../../api/history"
import { downloadSessionPdf } from "../../api/sessions"

const MODE_LABELS = {
  training: "Entraînement",
  diagnostic: "Test de Niveau",
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

function SessionRow({ row, onOpen, onOpenDiagnostic }) {
  const pct = Math.round((row.accuracy || 0) * 100)
  const tone = pct >= 80 ? "text-sage-deep" : pct >= 40 ? "text-honey" : "text-rose"
  const isDiagnostic = row.mode === "diagnostic"
  const openRow = () => onOpen(row)
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={openRow}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          openRow()
        }
      }}
      className="w-full text-left flex items-center justify-between py-3 border-b border-sage/10 last:border-0 gap-3 hover:bg-mist/60 active:bg-mist/80 focus-visible:bg-mist/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-deep rounded-md px-2 -mx-2 transition-colors cursor-pointer"
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
              onOpenDiagnostic(row)
            }}
            className="min-w-11 min-h-11 p-2 inline-flex items-center justify-center rounded-full text-stem hover:text-bark hover:bg-sage-leaf/40 active:bg-sage-leaf/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-deep transition-colors cursor-pointer"
            title="Voir le verdict du test de niveau"
            aria-label="Voir le verdict du test de niveau"
            data-testid="history-row-verdict"
          >
            <Icon name="flag" size={18} />
          </button>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            downloadSessionPdf(row.id)
          }}
          className="p-2 rounded-md text-stem hover:text-bark hover:bg-sage-leaf/40 transition-colors cursor-pointer"
          title="Exporter la session (PDF)"
          aria-label="Exporter la session PDF"
          data-testid="history-row-pdf"
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
    </div>
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

  const title = child ? `Historique · ${child.display_name}` : "Historique"
  const hasRows = rows && rows.length > 0

  return (
    <AppShell
      surface="greenhouse"
      topBar={
        <TopBar
          leading={<TopBarBack to={backTo} label={backLabel} data-testid="history-back" />}
          title={title}
        />
      }
    >
      <Page maxWidth="lg">
        <Card className="p-6 md:p-8">
        <Heading level={2}>Historique des sessions</Heading>

        {hasRows && (
          <div className="flex flex-wrap gap-2 my-5" data-testid="history-exports">
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
        )}

        {error && (
          <div className="text-rose px-3 py-2 rounded-lg bg-rose/15 mb-4">{error}</div>
        )}

        {rows === null && !error && (
          <div className="text-stem text-sm">Chargement…</div>
        )}

        {rows && rows.length === 0 && (
          <EmptyState
            data-testid="history-empty"
            icon="history"
            title="Aucune session pour l’instant"
            body="Commence par un test de niveau ou un entraînement."
            cta={{
              label: "Commencer",
              icon: "play_arrow",
              onClick: () => navigate("/"),
              "data-testid": "history-empty-cta",
            }}
          />
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
                onOpenDiagnostic={(r) =>
                  navigate(
                    `/history/diagnostic/${r.id}${fromParent ? "?from=parent" : ""}`
                  )
                }
              />
            ))}
          </Card>
        )}
      </Card>
      </Page>
    </AppShell>
  )
}
