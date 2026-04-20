import { useEffect, useRef, useState } from "react"
import { useNavigate, useSearchParams } from "react-router"
import { useAuthStore } from "../../stores/authStore"
import AppShell from "../layout/AppShell"
import Button from "../ui/Button"
import Card from "../ui/Card"
import { Heading } from "../ui/Heading"

export default function GoogleCallbackScreen() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const googleLogin = useAuthStore((s) => s.googleLogin)
  const code = params.get("code")
  const oauthError = params.get("error")
  const initialError = oauthError
    ? "Connexion Google annulée"
    : !code
      ? "Code Google manquant"
      : null
  const [error, setError] = useState(initialError)
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current || initialError) return
    ran.current = true
    googleLogin(code)
      .then(() => navigate("/children", { replace: true }))
      .catch(() => setError("Échec de la connexion Google"))
  }, [code, initialError, googleLogin, navigate])

  return (
    <AppShell surface="water">
      <div className="flex-1 flex items-center justify-center p-5 sm:p-6">
      <Card variant="specimen" className="p-6 sm:p-8 text-center max-w-md w-full space-y-5">
        {error ? (
          <>
            <Heading level={3}>{error}</Heading>
            <Button onClick={() => navigate("/login", { replace: true })}>
              Retour à la connexion
            </Button>
          </>
        ) : (
          <>
            <Heading level={3}>Connexion en cours…</Heading>
            <p className="text-stem">Le jardinier prépare ta serre.</p>
          </>
        )}
      </Card>
      </div>
    </AppShell>
  )
}
