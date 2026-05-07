import { useCallback, useEffect, useRef, useState } from "react"
import AppShell from "../layout/AppShell"
import TopBar from "../layout/TopBar"
import { TopBarBack } from "../layout/TopBarActions"
import Button from "../ui/Button"
import Icon from "../ui/Icon"
import AtelierPdfReader from "./AtelierPdfReader"

const LIBRARY = [
  {
    id: "ceb-2024",
    title: "CEB 2024 — Questionnaires",
    url: "/atelier-pdf/CEB_2024_Maths.pdf",
    description: "Épreuve externe commune, fin de P6 (FWB)."
  }
]

export default function AtelierPdfScreen() {
  const [source, setSource] = useState(null)

  const handlePick = (next) => setSource(next)
  const handleChange = useCallback(() => {
    setSource((prev) => {
      if (prev?.isLocal && prev.url) URL.revokeObjectURL(prev.url)
      return null
    })
  }, [])

  useEffect(() => {
    return () => {
      if (source?.isLocal && source.url) URL.revokeObjectURL(source.url)
    }
  }, [source])

  return (
    <AppShell
      surface="paper"
      topBar={
        <TopBar
          leading={
            source ? (
              <TopBarBack onClick={handleChange} label="Choisir un autre PDF" />
            ) : (
              <TopBarBack to="/" label="Serre" />
            )
          }
          title="Atelier PDF"
        />
      }
    >
      {source ? (
        <AtelierPdfReader source={source} />
      ) : (
        <PdfChooser onPick={handlePick} />
      )}
    </AppShell>
  )
}

function PdfChooser({ onPick }) {
  const fileInputRef = useRef(null)
  const [error, setError] = useState(null)
  const [dragOver, setDragOver] = useState(false)

  const acceptFile = (file) => {
    if (!file) return
    const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name)
    if (!isPdf) {
      setError("Ce fichier n'est pas un PDF.")
      return
    }
    setError(null)
    const url = URL.createObjectURL(file)
    onPick({ url, title: file.name, isLocal: true })
  }

  return (
    <div className="flex-1 flex flex-col items-center px-4 sm:px-6 py-8 gap-8 max-w-3xl w-full mx-auto">
      <div className="text-center">
        <h2 className="font-display text-2xl text-bark mb-1">Choisis un sujet</h2>
        <p className="text-sm text-stem">
          Charge un PDF depuis ton appareil, ou ouvre un sujet déjà disponible.
        </p>
      </div>

      <div
        className={`w-full rounded-2xl border-2 border-dashed transition-colors px-6 py-10 text-center ${
          dragOver ? "border-sage bg-sage-leaf/30" : "border-sage/30 bg-bone"
        }`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          acceptFile(e.dataTransfer.files?.[0])
        }}
        data-testid="pdf-chooser-drop"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="p-3 rounded-full bg-sage-leaf/40 text-sage-deep">
            <Icon name="description" size={28} />
          </div>
          <div>
            <p className="font-display text-lg text-bark">Mon appareil</p>
            <p className="text-xs text-stem mt-0.5">
              PC, tablette ou téléphone. Le fichier reste sur ton appareil.
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            data-testid="pdf-chooser-input"
            onChange={(e) => {
              acceptFile(e.target.files?.[0])
              e.target.value = ""
            }}
          />
          <Button
            size="md"
            onClick={() => fileInputRef.current?.click()}
            data-testid="pdf-chooser-pick"
          >
            <Icon name="add" /> Choisir un fichier PDF
          </Button>
        </div>
      </div>

      {error && (
        <div className="text-rose px-3 py-2 rounded-lg bg-rose-soft/60 w-full text-center" role="alert">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 w-full text-stem text-xs uppercase tracking-wider">
        <span className="flex-1 h-px bg-sage/20" />
        <span>ou</span>
        <span className="flex-1 h-px bg-sage/20" />
      </div>

      <div className="w-full flex flex-col gap-3">
        <h3 className="font-display text-sm text-bark">Sujets disponibles</h3>
        <div className="flex flex-col gap-2">
          {LIBRARY.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onPick({ url: item.url, title: item.title, isLocal: false })}
              data-testid={`pdf-library-${item.id}`}
              className="flex items-center gap-4 text-left rounded-2xl border border-sage/20 bg-bone hover:bg-mist hover:border-sage/40 transition-colors px-4 py-3 cursor-pointer"
            >
              <div className="p-2 rounded-lg bg-sage-leaf/40 text-sage-deep">
                <Icon name="description" size={20} />
              </div>
              <div className="flex-1">
                <p className="font-display text-bark">{item.title}</p>
                <p className="text-xs text-stem">{item.description}</p>
              </div>
              <Icon name="arrow_forward" size={16} />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
