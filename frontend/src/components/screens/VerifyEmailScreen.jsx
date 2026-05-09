import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router"
import { accountApi } from "../../api/account"
import AppShell from "../layout/AppShell"
import Button from "../ui/Button"
import Card from "../ui/Card"
import Input from "../ui/Input"
import Loader from "../ui/Loader"
import { Heading } from "../ui/Heading"

export default function VerifyEmailScreen() {
  const { key } = useParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState("pending")
  const [resendEmail, setResendEmail] = useState("")
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)

  useEffect(() => {
    if (!key) {
      setStatus("invalid")
      return
    }
    accountApi
      .verifyEmail(key)
      .then(() => setStatus("ok"))
      .catch(() => setStatus("invalid"))
  }, [key])

  const onResend = async (e) => {
    e.preventDefault()
    if (!resendEmail) return
    setResending(true)
    try {
      await accountApi.resendVerificationEmail(resendEmail)
    } catch {
      // ignore — show confirmation anyway to avoid leaking which emails exist
    } finally {
      setResent(true)
      setResending(false)
    }
  }

  return (
    <AppShell surface="greenhouse">
      <div className="flex-1 flex items-center justify-center p-5 sm:p-6">
        <Card variant="tag" className="w-full max-w-md p-6 sm:p-8 space-y-5">
          {status === "pending" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <Loader message="Vérification en cours…" />
            </div>
          )}

          {status === "ok" && (
            <div className="space-y-4" data-testid="verify-success">
              <Heading level={2}>Email confirmé</Heading>
              <p className="text-sm text-stem">
                Ton compte est activé. Tu peux maintenant te connecter.
              </p>
              <Button
                type="button"
                onClick={() => navigate("/login")}
                className="w-full"
                data-testid="verify-go-login"
              >
                Se connecter
              </Button>
            </div>
          )}

          {status === "invalid" && (
            <div className="space-y-4" data-testid="verify-invalid">
              <Heading level={2}>Lien invalide ou expiré</Heading>
              <p className="text-sm text-stem">
                Ce lien de vérification n'est plus valable. Saisis ton email pour qu'on
                t'en envoie un nouveau.
              </p>
              <form onSubmit={onResend} className="space-y-3">
                <label className="block">
                  <span className="text-sm font-medium text-bark">Email</span>
                  <Input
                    type="email"
                    required
                    autoComplete="email"
                    inputMode="email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    className="mt-1"
                    data-testid="verify-resend-email"
                  />
                </label>
                <Button
                  type="submit"
                  disabled={resending || resent}
                  className="w-full"
                  data-testid="verify-resend-submit"
                >
                  {resent ? "Lien envoyé ✓" : resending ? "Envoi…" : "Renvoyer un lien"}
                </Button>
              </form>
              <p className="text-sm text-center text-stem">
                <Link to="/login" className="text-sage-deep font-semibold hover:underline">
                  Retour à la connexion
                </Link>
              </p>
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  )
}
