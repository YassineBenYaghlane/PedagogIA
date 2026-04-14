import { useState } from "react"
import { Link, useNavigate } from "react-router"
import { useAuthStore } from "../../stores/authStore"
import { startGoogleLogin } from "../../lib/googleOAuth"

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
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
      <form onSubmit={onSubmit} className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-4" data-testid="login-form">
        <h1 className="text-2xl font-bold text-slate-900">Connexion</h1>
        <p className="text-sm text-slate-600">L'Explorateur — PedagogIA</p>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            data-testid="login-email"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Mot de passe</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            data-testid="login-password"
          />
        </label>

        {error && <p className="text-sm text-red-600" data-testid="login-error">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-blue-600 text-white font-semibold py-2 hover:bg-blue-700 disabled:opacity-50"
          data-testid="login-submit"
        >
          {busy ? "Connexion…" : "Se connecter"}
        </button>

        <div className="flex items-center gap-3 py-2">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs text-slate-500 uppercase tracking-wide">ou</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <button
          type="button"
          onClick={startGoogleLogin}
          className="w-full rounded-lg border border-slate-300 bg-white text-slate-700 font-medium py-2 flex items-center justify-center gap-2 hover:bg-slate-50"
          data-testid="login-google"
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.6 2.3 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.8 6C12.3 13.3 17.7 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 7.1-10 7.1-17.5z"/>
            <path fill="#FBBC05" d="M10.4 28.7c-.5-1.5-.8-3.1-.8-4.7s.3-3.2.8-4.7l-7.8-6C1 16.8 0 20.3 0 24s1 7.2 2.6 10.7l7.8-6z"/>
            <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.5-5.8c-2 1.4-4.6 2.3-7.7 2.3-6.3 0-11.7-3.8-13.6-9.8l-7.8 6C6.5 42.6 14.6 48 24 48z"/>
          </svg>
          Se connecter avec Google
        </button>

        <p className="text-sm text-center text-slate-600">
          Pas de compte ? <Link to="/register" className="text-blue-600 font-medium">Créer un compte</Link>
        </p>
      </form>
    </div>
  )
}
