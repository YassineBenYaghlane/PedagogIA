import { useState } from "react"
import { Link, useNavigate } from "react-router"
import { useAuthStore } from "../../stores/authStore"

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

        <p className="text-sm text-center text-slate-600">
          Pas de compte ? <Link to="/register" className="text-blue-600 font-medium">Créer un compte</Link>
        </p>
      </form>
    </div>
  )
}
