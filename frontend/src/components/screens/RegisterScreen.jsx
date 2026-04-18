import { useState } from "react"
import { Link, useNavigate } from "react-router"
import { useAuthStore } from "../../stores/authStore"
import AppShell from "../layout/AppShell"
import Button from "../ui/Button"
import Card from "../ui/Card"
import Input from "../ui/Input"
import { Heading, LatinLabel } from "../ui/Heading"

export default function RegisterScreen() {
  const register = useAuthStore((s) => s.register)
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await register(email, password, displayName)
      navigate("/children")
    } catch (err) {
      const msg = err.data ? JSON.stringify(err.data) : err.message
      setError(msg)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AppShell surface="greenhouse">
      <div className="flex-1 flex items-center justify-center p-5 sm:p-6">
      <Card variant="tag" className="w-full max-w-md p-6 sm:p-8 space-y-5">
        <form onSubmit={onSubmit} data-testid="register-form" className="space-y-5">
          <div>
            <LatinLabel>Novum hortum plantare</LatinLabel>
            <Heading level={2} className="mt-1">
              Créer un compte
            </Heading>
            <p className="text-sm text-stem mt-1">Plante ta première graine.</p>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-bark">Prénom (optionnel)</span>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="given-name"
              className="mt-1"
              data-testid="register-name"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-bark">Email</span>
            <Input
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1"
              data-testid="register-email"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-bark">Mot de passe (8+ caractères)</span>
            <Input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1"
              data-testid="register-password"
            />
          </label>

          {error && (
            <p
              className="text-sm text-rose whitespace-pre-wrap px-3 py-2 rounded-lg bg-rose-soft/60"
              data-testid="register-error"
              role="alert"
              aria-live="polite"
            >
              {error}
            </p>
          )}

          <Button type="submit" disabled={busy} className="w-full" data-testid="register-submit">
            {busy ? "Création…" : "Créer le compte"}
          </Button>

          <p className="text-sm text-center text-stem">
            Déjà inscrit ?{" "}
            <Link to="/login" className="text-sage-deep font-semibold hover:underline">
              Se connecter
            </Link>
          </p>
        </form>
      </Card>
      </div>
    </AppShell>
  )
}
