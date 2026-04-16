import { useEffect } from "react"
import Button from "./Button"
import { Heading, LatinLabel } from "./Heading"

export default function Floraison({ title = "Floraison", latin = "Florens", subtitle, onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 water flex items-center justify-center p-6 animate-[floraison-fade_300ms_ease-out]"
      role="dialog"
      aria-modal="true"
    >
      <div className="max-w-md w-full text-center">
        <svg
          viewBox="0 0 120 120"
          className="w-40 h-40 mx-auto animate-[floraison-bloom_600ms_ease-out]"
          aria-hidden="true"
        >
          <g transform="translate(60 60)">
            <circle cx="0" cy="-22" r="14" fill="#E8A6A1" stroke="#B7615C" strokeWidth="1.2" />
            <circle cx="22" cy="-10" r="14" fill="#E8A6A1" stroke="#B7615C" strokeWidth="1.2" />
            <circle cx="22" cy="14" r="14" fill="#E8A6A1" stroke="#B7615C" strokeWidth="1.2" />
            <circle cx="-22" cy="14" r="14" fill="#E8A6A1" stroke="#B7615C" strokeWidth="1.2" />
            <circle cx="-22" cy="-10" r="14" fill="#E8A6A1" stroke="#B7615C" strokeWidth="1.2" />
            <circle cx="0" cy="0" r="10" fill="#E8C66A" stroke="#8A6A1F" strokeWidth="1.2" />
          </g>
          <path
            d="M60 85 Q52 100 40 102"
            stroke="#6FA274"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M60 85 Q68 100 80 102"
            stroke="#6FA274"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
        <LatinLabel className="mt-4 inline-block">{latin}</LatinLabel>
        <Heading level={1} className="mt-2">
          {title}
        </Heading>
        {subtitle && <p className="text-stem mt-3">{subtitle}</p>}
        <div className="mt-8">
          <Button size="lg" onClick={onClose}>
            Continuer
          </Button>
        </div>
      </div>
      <style>{`
        @keyframes floraison-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes floraison-bloom {
          0% { transform: scale(0.4) rotate(-8deg); opacity: 0 }
          60% { transform: scale(1.05) rotate(2deg); opacity: 1 }
          100% { transform: scale(1) rotate(0); opacity: 1 }
        }
      `}</style>
    </div>
  )
}
