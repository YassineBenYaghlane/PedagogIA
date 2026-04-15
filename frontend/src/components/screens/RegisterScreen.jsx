import { useState } from "react"
import { Link, useNavigate } from "react-router"
import { useAuthStore } from "../../stores/authStore"

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
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
      <form onSubmit={onSubmit} className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-4" data-testid="register-form">
        <h1 className="text-2xl font-bold text-slate-900">Créer un compte</h1>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Prénom (optionnel)</span>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            data-testid="register-name"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            data-testid="register-email"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Mot de passe (8+ caractères)</span>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            data-testid="register-password"
          />
        </label>

        {error && <p className="text-sm text-red-600 whitespace-pre-wrap" data-testid="register-error">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-blue-600 text-white font-semibold py-2 hover:bg-blue-700 disabled:opacity-50"
          data-testid="register-submit"
        >
          {busy ? "Création…" : "Créer le compte"}
        </button>

        <p className="text-sm text-center text-slate-600">
          Déjà inscrit ? <Link to="/login" className="text-blue-600 font-medium">Se connecter</Link>
        </p>
      </form>
    </div>
  )
}
