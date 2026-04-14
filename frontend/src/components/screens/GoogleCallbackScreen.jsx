import { useEffect, useRef, useState } from "react"
import { useNavigate, useSearchParams } from "react-router"
import { useAuthStore } from "../../stores/authStore"

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
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
        {error ? (
          <>
            <p className="text-red-600 font-medium mb-4">{error}</p>
            <button
              onClick={() => navigate("/login", { replace: true })}
              className="rounded-lg bg-blue-600 text-white font-semibold px-4 py-2 hover:bg-blue-700"
            >
              Retour à la connexion
            </button>
          </>
        ) : (
          <p className="text-slate-700">Connexion en cours…</p>
        )}
      </div>
    </div>
  )
}
