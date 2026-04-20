import { useEffect, useState } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router"
import AppShell from "../layout/AppShell"
import Loader from "../ui/Loader"
import { diagnosticApi } from "../../api/diagnostic"
import { useAuthStore } from "../../stores/authStore"
import DiagnosticResult from "./DiagnosticResult"

export default function DiagnosticReviewScreen() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const fromParent = searchParams.get("from") === "parent"
  const { children, selectedChildId } = useAuthStore()
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    diagnosticApi
      .result(sessionId)
      .then((data) => {
        if (!cancelled) setResult(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.status === 404 ? "Test de niveau introuvable." : err.message)
      })
    return () => {
      cancelled = true
    }
  }, [sessionId])

  const child = result
    ? children.find((c) => c.id === result.student_id) ||
      children.find((c) => c.id === selectedChildId)
    : null

  if (error) {
    return (
      <AppShell surface="greenhouse">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-rose px-4 py-3 rounded-lg bg-rose/15" role="alert">
            {error}
          </div>
        </div>
      </AppShell>
    )
  }
  if (!result) {
    return (
      <AppShell surface="greenhouse">
        <Loader message="Chargement du test de niveau…" size="lg" variant="page" />
      </AppShell>
    )
  }

  return (
    <DiagnosticResult
      result={result}
      child={child}
      onBack={() => navigate(fromParent ? "/history?from=parent" : "/history")}
      backLabel="Retour à l’historique"
      backIcon="arrow_back"
    />
  )
}
