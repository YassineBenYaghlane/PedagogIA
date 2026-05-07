import { useEffect, useMemo } from "react"
import Button from "../ui/Button"
import Card from "../ui/Card"
import Icon from "../ui/Icon"
import { Heading } from "../ui/Heading"
import { MIC_ERROR_CODES, detectBrowserFamily } from "../../lib/microphone"

const COPY = {
  [MIC_ERROR_CODES.PERMISSION_DENIED]: {
    title: "Le micro est bloqué",
    intro:
      "Pour parler avec le tuteur, on a besoin que tu autorises l'accès au micro depuis les réglages du navigateur. C'est un réglage qui reste mémorisé — il suffit de le changer une fois."
  },
  [MIC_ERROR_CODES.NOT_FOUND]: {
    title: "Aucun micro détecté",
    intro:
      "On n'a trouvé aucun micro sur cet appareil. Branche un casque ou un micro, puis réessaie."
  },
  [MIC_ERROR_CODES.IN_USE]: {
    title: "Le micro est déjà utilisé",
    intro:
      "Une autre app ou un autre onglet capte déjà ton micro (visioconférence, dictée, autre PWA). Ferme-les puis réessaie."
  },
  [MIC_ERROR_CODES.UNSUPPORTED]: {
    title: "Ton navigateur ne gère pas le micro",
    intro:
      "L'enregistrement vocal ne marche pas sur ce navigateur. Essaie avec une version récente de Safari, Chrome ou Firefox."
  },
  [MIC_ERROR_CODES.INSECURE_CONTEXT]: {
    title: "Connexion non sécurisée",
    intro:
      "Le micro fonctionne uniquement sur HTTPS. Ouvre l'app sur https://collegia.be."
  },
  [MIC_ERROR_CODES.IN_APP_BROWSER]: {
    title: "Ouvre l'app dans Safari ou Chrome",
    intro:
      "Le navigateur intégré (Instagram, Facebook, LinkedIn…) bloque l'accès au micro. Touche le menu ⋯ en haut à droite puis « Ouvrir dans Safari » ou « Ouvrir dans Chrome »."
  },
  [MIC_ERROR_CODES.UNKNOWN]: {
    title: "Le micro n'a pas pu démarrer",
    intro: "Quelque chose a coincé du côté du navigateur. Réessaie, ou redémarre-le."
  }
}

function getRecoverySteps(family) {
  switch (family) {
    case "ios":
      return [
        "Touche **AA** à gauche de la barre d'adresse",
        "Choisis **Réglages du site web**",
        "Mets **Microphone** sur **Autoriser**",
        "Recharge la page"
      ]
    case "android_chrome":
    case "android_firefox":
      return [
        "Touche l'icône à gauche de l'URL (**cadenas** ou **réglages**)",
        "Choisis **Autorisations**",
        "Active **Microphone**",
        "Recharge la page"
      ]
    case "safari":
      return [
        "Ouvre le menu **Safari → Réglages → Sites web**",
        "Clique sur **Microphone** dans la colonne de gauche",
        "Trouve **collegia.be** et choisis **Autoriser**",
        "Recharge la page"
      ]
    case "firefox":
      return [
        "Clique sur le **cadenas** à gauche de l'URL",
        "À côté de « Utiliser le microphone », clique sur la **croix** pour effacer le blocage",
        "Recharge la page et réautorise"
      ]
    case "chrome":
    case "edge":
    default:
      return [
        "Clique sur l'icône à gauche de l'URL — un **bouton réglages** (trois curseurs) sur Chrome récent, sinon un **cadenas**",
        "Choisis **Paramètres du site** (ou **Autorisations**)",
        "Mets **Microphone** sur **Autoriser**",
        "Recharge la page"
      ]
  }
}

function renderRich(line) {
  const parts = line.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-bark">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return <span key={i}>{part}</span>
  })
}

export default function MicPermissionModal({ open, code, onClose, onRetry }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault()
        onClose?.()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  const family = useMemo(() => detectBrowserFamily(), [])

  if (!open || !code) return null
  const copy = COPY[code] ?? COPY[MIC_ERROR_CODES.UNKNOWN]
  const showSteps = code === MIC_ERROR_CODES.PERMISSION_DENIED
  const steps = showSteps ? getRecoverySteps(family) : null
  const showReload = code === MIC_ERROR_CODES.PERMISSION_DENIED
  const showRetry =
    !showReload &&
    code !== MIC_ERROR_CODES.UNSUPPORTED &&
    code !== MIC_ERROR_CODES.INSECURE_CONTEXT &&
    code !== MIC_ERROR_CODES.IN_APP_BROWSER

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-bark/30 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mic-permission-title"
      onClick={onClose}
      data-testid="mic-permission-modal"
    >
      <Card
        className="p-6 sm:p-7 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-10 h-10 rounded-xl bg-sky/30 text-sky-deep flex items-center justify-center">
            <Icon name="mic_off" size={20} />
          </div>
          <div className="flex-1">
            <Heading level={3} id="mic-permission-title">
              {copy.title}
            </Heading>
            <p className="text-sm text-stem mt-2 leading-relaxed">{copy.intro}</p>
          </div>
        </div>

        {steps && (
          <ol className="mt-5 space-y-2.5" data-testid="mic-permission-steps">
            {steps.map((line, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-sage-leaf/60 text-sage-deep text-xs font-semibold flex items-center justify-center mt-0.5">
                  {idx + 1}
                </span>
                <span className="text-sm text-bark leading-relaxed">
                  {renderRich(line)}
                </span>
              </li>
            ))}
          </ol>
        )}

        {showSteps && (
          <p className="mt-4 flex items-start gap-2 text-xs text-stem">
            <Icon name="info" size={14} className="mt-0.5 shrink-0" />
            <span>
              Sur la plupart des navigateurs, le réglage est mémorisé : tu n'auras à le faire
              qu'une seule fois.
            </span>
          </p>
        )}

        <div className="mt-6 flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            variant="ghost"
            onClick={onClose}
            className="flex-1"
            data-testid="mic-permission-close"
          >
            Fermer
          </Button>
          {showReload && (
            <Button
              variant="primary"
              onClick={() => window.location.reload()}
              className="flex-1"
              data-testid="mic-permission-reload"
            >
              Recharger la page
            </Button>
          )}
          {showRetry && onRetry && (
            <Button
              variant="primary"
              onClick={onRetry}
              className="flex-1"
              data-testid="mic-permission-retry"
            >
              Réessayer
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}
