import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router"
import { useAuthStore } from "../../stores/authStore"
import { startGoogleLogin } from "../../lib/googleOAuth"
import AppShell from "../layout/AppShell"
import Button from "../ui/Button"
import Card from "../ui/Card"
import Input from "../ui/Input"
import { Heading, LatinLabel } from "../ui/Heading"

function scorePassword(pw) {
  if (!pw) return 0
  let s = 0
  if (pw.length >= 8) s += 1
  if (pw.length >= 12) s += 1
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s += 1
  if (/\d/.test(pw)) s += 1
  if (/[^A-Za-z0-9]/.test(pw)) s += 1
  return Math.min(s, 4)
}

const STRENGTH = [
  { label: "Trop court", tone: "bg-rose text-rose" },
  { label: "Faible", tone: "bg-rose text-rose" },
  { label: "Correct", tone: "bg-honey text-honey" },
  { label: "Bon", tone: "bg-sage text-sage-deep" },
  { label: "Solide", tone: "bg-sage-deep text-sage-deep" },
]

export default function RegisterScreen() {
  const register = useAuthStore((s) => s.register)
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const score = useMemo(() => scorePassword(password), [password])
  const mismatch = confirm.length > 0 && confirm !== password

  const onSubmit = async (e) => {
    e.preventDefault()
    if (mismatch) {
      setError("Les mots de passe ne correspondent pas.")
      return
    }
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

  const strength = STRENGTH[score]

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
              inputMode="text"
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
            {password && (
              <div
                className="mt-2 flex items-center gap-2"
                data-testid="register-strength"
                aria-live="polite"
              >
                <div className="flex-1 h-1.5 rounded-full bg-mist overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${strength.tone.split(" ")[0]}`}
                    style={{ width: `${(score / 4) * 100}%` }}
                  />
                </div>
                <span className={`text-xs font-semibold ${strength.tone.split(" ")[1]}`}>
                  {strength.label}
                </span>
              </div>
            )}
          </label>

          <label className="block">
            <span className="text-sm font-medium text-bark">Confirmer le mot de passe</span>
            <Input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1"
              data-testid="register-password-confirm"
              aria-invalid={mismatch}
            />
            {mismatch && (
              <p
                className="mt-1 text-xs text-rose"
                data-testid="register-password-mismatch"
                role="alert"
                aria-live="polite"
              >
                Les deux mots de passe doivent être identiques.
              </p>
            )}
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

          <Button
            type="submit"
            disabled={busy || mismatch}
            className="w-full"
            data-testid="register-submit"
          >
            {busy ? "Création…" : "Créer le compte"}
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
            data-testid="register-google"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.6 2.3 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.8 6C12.3 13.3 17.7 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 7.1-10 7.1-17.5z" />
              <path fill="#FBBC05" d="M10.4 28.7c-.5-1.5-.8-3.1-.8-4.7s.3-3.2.8-4.7l-7.8-6C1 16.8 0 20.3 0 24s1 7.2 2.6 10.7l7.8-6z" />
              <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.5-5.8c-2 1.4-4.6 2.3-7.7 2.3-6.3 0-11.7-3.8-13.6-9.8l-7.8 6C6.5 42.6 14.6 48 24 48z" />
            </svg>
            Continuer avec Google
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
