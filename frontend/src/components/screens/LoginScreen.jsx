import { useState } from "react"
import { Link, useNavigate } from "react-router"
import { useAuthStore } from "../../stores/authStore"
import { startGoogleLogin } from "../../lib/googleOAuth"
import AppShell from "../layout/AppShell"
import Button from "../ui/Button"
import Card from "../ui/Card"
import Input from "../ui/Input"
import { Heading, LatinLabel } from "../ui/Heading"

export default function LoginScreen() {
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await login(email, password)
      navigate("/children")
    } catch {
      setError("Email ou mot de passe incorrect")
    } finally {
      setBusy(false)
    }
  }

  return (
    <AppShell surface="greenhouse" className="items-center justify-center">
      <div className="flex-1 flex items-center justify-center p-5 sm:p-6">
        <Card variant="tag" className="w-full max-w-md p-6 sm:p-8 space-y-5">
          <form onSubmit={onSubmit} data-testid="login-form" className="space-y-5">
            <div>
              <LatinLabel>Ad hortum redi</LatinLabel>
              <Heading level={2} className="mt-1">
                Connexion
              </Heading>
              <p className="text-sm text-stem mt-1">CollegIA — retourner au jardin.</p>
            </div>

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
                data-testid="login-email"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-bark">Mot de passe</span>
              <Input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1"
                data-testid="login-password"
              />
            </label>

            {error && (
              <p
                className="text-sm text-rose px-3 py-2 rounded-lg bg-rose-soft/60"
                data-testid="login-error"
                role="alert"
                aria-live="polite"
              >
                {error}
              </p>
            )}

          <Button type="submit" disabled={busy} className="w-full" data-testid="login-submit">
            {busy ? "Connexion…" : "Se connecter"}
          </Button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-sage/15" />
            <span className="text-[11px] text-stem uppercase tracking-widest">ou</span>
            <div className="flex-1 h-px bg-sage/15" />
          </div>

          <Button
            type="button"
            variant="ghost"
            onClick={startGoogleLogin}
            className="w-full"
            data-testid="login-google"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.6 2.3 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.8 6C12.3 13.3 17.7 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 7.1-10 7.1-17.5z" />
              <path fill="#FBBC05" d="M10.4 28.7c-.5-1.5-.8-3.1-.8-4.7s.3-3.2.8-4.7l-7.8-6C1 16.8 0 20.3 0 24s1 7.2 2.6 10.7l7.8-6z" />
              <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.5-5.8c-2 1.4-4.6 2.3-7.7 2.3-6.3 0-11.7-3.8-13.6-9.8l-7.8 6C6.5 42.6 14.6 48 24 48z" />
            </svg>
            Se connecter avec Google
          </Button>

            <p className="text-sm text-center text-stem">
              Pas de compte ?{" "}
              <Link to="/register" className="text-sage-deep font-semibold hover:underline">
                Créer un compte
              </Link>
            </p>
          </form>
        </Card>
      </div>
    </AppShell>
  )
}
