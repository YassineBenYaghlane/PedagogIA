import { useEffect } from "react"
import { useNavigate } from "react-router"
import Icon from "../ui/Icon"
import { useAuthStore } from "../../stores/authStore"

const STATUS_LABELS = {
  not_started: "Pas commencé",
  in_progress: "En cours",
  mastered: "Maîtrisé",
  needs_review: "À revoir"
}

const STATUS_TONES = {
  not_started: "text-on-surface-variant",
  in_progress: "text-primary",
  mastered: "text-tertiary",
  needs_review: "text-error"
}

function MasterySummary({ summary }) {
  if (!summary) return null
  return (
    <div className="grid grid-cols-2 gap-3 mb-8">
      {Object.keys(STATUS_LABELS).map((k) => (
        <div key={k} className="bg-surface-container-low rounded-xl p-4 text-center">
          <div className={`text-3xl font-headline font-extrabold ${STATUS_TONES[k]}`}>
            {summary[k] ?? 0}
          </div>
          <div className="text-xs uppercase tracking-wide text-on-surface-variant mt-1">
            {STATUS_LABELS[k]}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function WelcomeScreen() {
  const navigate = useNavigate()
  const { children, selectedChildId, logout } = useAuthStore()
  const child = children.find((c) => c.id === selectedChildId)

  useEffect(() => {
    if (children.length === 0 || !selectedChildId) navigate("/children")
  }, [children, selectedChildId, navigate])

  if (!child) return null

  return (
    <div className="min-h-screen bg-background font-body text-on-surface flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="bg-orb absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 opacity-50" />
      <div className="bg-orb absolute top-[60%] -right-[5%] w-[30%] h-[30%] bg-secondary-container/20 opacity-50" />

      <div className="bg-surface-container-lowest rounded-xl shadow-ambient p-8 md:p-10 max-w-lg w-full ghost-border relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm uppercase tracking-wide text-on-surface-variant">Bonjour</p>
            <h1 className="font-headline text-3xl md:text-4xl font-extrabold text-primary tracking-tight">
              {child.display_name}
            </h1>
            <p className="text-on-surface-variant">Niveau {child.grade}</p>
          </div>
          <button
            data-testid="logout"
            onClick={async () => { await logout(); navigate("/login") }}
            className="text-on-surface-variant hover:text-on-surface text-sm flex items-center gap-1 cursor-pointer"
          >
            <Icon name="logout" /> Déconnexion
          </button>
        </div>

        <MasterySummary summary={child.mastery_summary} />

        <div className="space-y-3">
          <button
            data-testid="start-training"
            onClick={() => navigate("/exercise")}
            className="gradient-soul text-on-primary font-headline font-bold text-xl w-full py-4 rounded-xl shadow-[0_12px_24px_rgba(0,89,182,0.3)] spring-hover cursor-pointer flex items-center justify-center gap-3"
          >
            <Icon name="play_arrow" fill /> Entraînement
          </button>
          <button
            onClick={() => navigate("/skill-tree")}
            className="bg-surface-container-low hover:bg-surface-container text-on-surface font-headline font-bold text-lg w-full py-3 rounded-xl cursor-pointer flex items-center justify-center gap-3"
          >
            <Icon name="account_tree" /> Arbre des compétences
          </button>
          <button
            data-testid="start-drill"
            onClick={() => navigate("/drill")}
            className="bg-surface-container-low hover:bg-surface-container text-on-surface font-headline font-bold text-lg w-full py-3 rounded-xl cursor-pointer flex items-center justify-center gap-3"
          >
            <Icon name="bolt" fill /> Automatismes
          </button>
          <button
            data-testid="start-diagnostic"
            onClick={() => navigate("/diagnostic")}
            className="bg-surface-container-low hover:bg-surface-container text-on-surface font-headline font-bold text-lg w-full py-3 rounded-xl cursor-pointer flex items-center justify-center gap-3"
          >
            <Icon name="insights" /> Diagnostic
          </button>
          <button
            onClick={() => navigate("/children")}
            className="text-on-surface-variant hover:text-on-surface text-sm w-full py-2 cursor-pointer"
          >
            Changer d'explorateur
          </button>
        </div>
      </div>
    </div>
  )
}
