import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router"
import Icon from "../ui/Icon"
import { useAuthStore } from "../../stores/authStore"
import { historyApi } from "../../api/history"

const MODE_LABEL = {
  learn: "Apprentissage",
  drill: "Entraînement",
  diagnostic: "Diagnostic"
}

const dateFmt = new Intl.DateTimeFormat("fr-BE", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit"
})

function formatDuration(seconds) {
  if (seconds == null) return "—"
  if (seconds < 60) return `${seconds} s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s ? `${m} min ${s}s` : `${m} min`
}

export default function HistoryScreen() {
  const navigate = useNavigate()
  const { children, selectedChildId } = useAuthStore()
  const child = children.find((c) => c.id === selectedChildId)

  const { data, isLoading, isError } = useQuery({
    queryKey: ["history", selectedChildId],
    queryFn: () => historyApi.listSessions(selectedChildId),
    enabled: !!selectedChildId
  })

  if (!child) {
    navigate("/children")
    return null
  }

  const sessions = Array.isArray(data) ? data : data?.results || []

  return (
    <div className="min-h-screen bg-background font-body text-on-surface p-6 relative overflow-hidden">
      <div className="bg-orb absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-tertiary/10 opacity-50" />
      <div className="max-w-3xl mx-auto relative z-10 space-y-6">
        <div className="flex justify-between items-center">
          <button
            onClick={() => navigate("/profile")}
            className="text-on-surface-variant hover:text-on-surface flex items-center gap-1 cursor-pointer"
          >
            <Icon name="arrow_back" /> Profil
          </button>
        </div>

        <div className="bg-surface-container-lowest rounded-xl shadow-ambient ghost-border p-6 md:p-8">
          <div className="flex items-baseline justify-between gap-2 flex-wrap mb-4">
            <div>
              <p className="text-sm uppercase tracking-wide text-on-surface-variant">Historique</p>
              <h1 className="font-headline text-2xl font-extrabold text-primary">
                Sessions de {child.display_name}
              </h1>
            </div>
            <span className="text-sm text-on-surface-variant">{sessions.length} session{sessions.length > 1 ? "s" : ""}</span>
          </div>

          {isLoading && <p className="text-on-surface-variant">Chargement…</p>}
          {isError && <p className="text-error">Impossible de charger l'historique.</p>}
          {!isLoading && !isError && sessions.length === 0 && (
            <p className="text-on-surface-variant">
              Aucune session pour l'instant. Lance un exercice depuis l'accueil !
            </p>
          )}

          {sessions.length > 0 && (
            <ul className="space-y-3">
              {sessions.map((s) => (
                <li
                  key={s.id}
                  className="rounded-lg ghost-border p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                >
                  <div>
                    <p className="font-headline font-bold">
                      {dateFmt.format(new Date(s.started_at))}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {MODE_LABEL[s.mode] || s.mode} · {formatDuration(s.duration_seconds)}
                    </p>
                    {s.skills?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {s.skills.map((sk) => (
                          <span
                            key={sk.id}
                            className="text-xs bg-primary/10 text-primary rounded px-2 py-0.5"
                          >
                            {sk.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    {s.accuracy != null ? (
                      <>
                        <p className="font-headline text-2xl font-extrabold text-tertiary">
                          {s.accuracy}%
                        </p>
                        <p className="text-xs text-on-surface-variant">
                          {s.correct_count}/{s.attempt_count}
                        </p>
                      </>
                    ) : (
                      <p className="text-on-surface-variant text-sm">Sans réponse</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
