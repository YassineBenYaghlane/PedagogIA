import { useEffect, useState } from "react"
import { Link } from "react-router"
import AppShell from "../layout/AppShell"
import Page from "../layout/Page"
import Plant from "../ui/Plant"
import {
  AnimatedSeed,
  AnimatedSprout,
  AnimatedBud,
  AnimatedFlower,
  AnimatedWilted,
  PlantKeyframes,
} from "../ui/PlantAnimated"

const STATES = [
  {
    id: "locked",
    label: "Graine",
    tag: "en sommeil",
    latin: "Semen dormiens",
    staticStatus: "locked",
    Comp: AnimatedSeed,
    legacyMastery: 0,
    note: "Enveloppée, elle respire lentement. Une fissure dorée pulse — la promesse d'un départ.",
  },
  {
    id: "in_progress",
    label: "Pousse",
    tag: "en éveil",
    latin: "Plantula vivax",
    staticStatus: "in_progress",
    Comp: AnimatedSprout,
    legacyMastery: 0.2,
    note: "Deux cotylédons déplient leurs premières feuilles ; la sève cherche la lumière d'un balancement curieux.",
  },
  {
    id: "bud",
    label: "Bouton",
    tag: "en croissance",
    latin: "Gemma parata",
    staticStatus: "in_progress",
    Comp: AnimatedBud,
    legacyMastery: 0.6,
    note: "La tige s'élance et retient son bouton comme une promesse. Une goutte tombe, un feuillage frémit.",
  },
  {
    id: "done",
    label: "Floraison",
    tag: "épanouie",
    latin: "Floritura plena",
    staticStatus: "completed",
    Comp: AnimatedFlower,
    legacyMastery: 1,
    note: "Corolle ouverte, pollen qui s'élève, halo miel — la floraison respire à huit pétales, chacun à son tempo.",
  },
  {
    id: "wilted",
    label: "Fanée",
    tag: "à arroser",
    latin: "Planta sitiens",
    staticStatus: "review",
    Comp: AnimatedWilted,
    legacyMastery: 0.4,
    note: "Le port s'incline, les feuilles grisonnent. Une goutte bleue hésite au-dessus — il suffit d'un soin.",
  },
]

function Toggle({ active, onChange, children }) {
  return (
    <button
      onClick={onChange}
      className={`navlink ${active ? "active" : ""}`}
      aria-pressed={active}
    >
      {children}
    </button>
  )
}

function SpecimenCard({ state, options, index }) {
  const { Comp, label, tag, latin, note } = state
  return (
    <article
      className={`specimen relative flex flex-col items-stretch ${
        options.paused ? "jp-paused" : ""
      }`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="absolute top-3 left-4 text-[10px] font-mono tracking-[0.18em] uppercase text-twig">
        No {String(index + 1).padStart(2, "0")}
      </div>
      <div className="pt-8 pb-3 flex justify-center">
        <div className="w-40 h-48 flex items-center justify-center">
          <Comp pot={options.pot} halo={options.halo} />
        </div>
      </div>
      <div className="border-t border-dashed border-bark/10 px-4 py-3 bg-chalk/60 rounded-b-[0.875rem]">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-display italic text-xl text-bark">{label}</h3>
          <span className="text-[10px] uppercase tracking-[0.16em] text-stem">{tag}</span>
        </div>
        <div className="font-mono text-[11px] text-twig mt-0.5">{latin}</div>
        <p className="text-xs text-stem mt-2 leading-relaxed">{note}</p>
      </div>
    </article>
  )
}

function ComparePanel({ title, children, muted }) {
  return (
    <div
      className={`specimen flex flex-col ${
        muted ? "bg-chalk/70" : "bg-bone"
      }`}
    >
      <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-dashed border-bark/10">
        <span className="text-[10px] font-mono tracking-[0.18em] uppercase text-stem">{title}</span>
        <span
          className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
            muted ? "bg-mist text-stem" : "bg-sage-pale text-sage-deep"
          }`}
        >
          {muted ? "prod" : "debug"}
        </span>
      </div>
      <div className="flex-1 flex items-center justify-center py-8">{children}</div>
    </div>
  )
}

export default function DebugPlantsScreen() {
  const [halo, setHalo] = useState(true)
  const [pot, setPot] = useState(true)
  const [paused, setPaused] = useState(false)
  const [compareId, setCompareId] = useState("done")
  const [cycleIdx, setCycleIdx] = useState(0)
  const [auto, setAuto] = useState(true)

  useEffect(() => {
    if (!auto || paused) return
    const t = setInterval(() => setCycleIdx((i) => (i + 1) % STATES.length), 3800)
    return () => clearInterval(t)
  }, [auto, paused])

  const options = { halo, pot, paused }
  const hero = STATES[cycleIdx]
  const HeroComp = hero.Comp
  const compare = STATES.find((s) => s.id === compareId) ?? STATES[0]

  return (
    <AppShell surface="grid">
      <PlantKeyframes />
      <Page maxWidth="3xl">
        <header className="mb-8 flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="text-[11px] tracking-[0.24em] uppercase text-stem font-mono">
              Planche n° 7 · Laboratoire
            </div>
            <h1 className="font-display italic text-4xl md:text-5xl font-semibold text-bark leading-[1.05] mt-1">
              Observatoire <br className="hidden md:block" />
              botanique
            </h1>
            <p className="font-display italic text-stem text-lg mt-2">
              cinq états · cinq respirations
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/skill-tree" className="navlink">Carte</Link>
            <Link to="/" className="navlink">Retour</Link>
          </div>
        </header>

        <section
          className={`specimen mb-10 overflow-hidden grid md:grid-cols-[1fr,auto] gap-4 ${
            paused ? "jp-paused" : ""
          }`}
        >
          <div className="p-6 md:p-8 flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-mono tracking-[0.22em] uppercase text-stem mb-2">
                Chronologie de floraison
              </div>
              <h2 className="font-display italic text-3xl md:text-4xl text-bark">
                {hero.label}{" "}
                <span className="text-stem text-xl">— {hero.tag}</span>
              </h2>
              <div className="font-mono text-xs text-twig mt-1">{hero.latin}</div>
              <p className="text-stem text-sm leading-relaxed mt-4 max-w-md">{hero.note}</p>
            </div>
            <div className="mt-6 flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                {STATES.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setAuto(false)
                      setCycleIdx(i)
                    }}
                    aria-label={s.label}
                    className={`h-2 rounded-full transition-all ${
                      i === cycleIdx ? "w-6 bg-sage-deep" : "w-2 bg-sage-pale hover:bg-sage-soft"
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={() => setAuto((v) => !v)}
                className={`navlink ${auto ? "active" : ""}`}
              >
                {auto ? "▶ défile" : "▶ lancer"}
              </button>
            </div>
          </div>
          <div className="bg-mist/50 flex items-center justify-center px-8 py-10 md:py-6 md:pr-10 md:pl-0">
            <div className="w-56 h-72 md:w-64 md:h-80 flex items-center justify-center">
              <HeroComp pot={pot} halo={halo} />
            </div>
          </div>
        </section>

        <section className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-mono tracking-[0.22em] uppercase text-stem mr-2">
            Réglages
          </span>
          <Toggle active={halo} onChange={() => setHalo((v) => !v)}>Halo</Toggle>
          <Toggle active={pot} onChange={() => setPot((v) => !v)}>Pot</Toggle>
          <Toggle active={!paused} onChange={() => setPaused((v) => !v)}>
            {paused ? "Figé" : "Animé"}
          </Toggle>
          <div className="ml-auto text-[11px] font-mono text-twig">
            /debug/plants · dev-only
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-12">
          {STATES.map((s, i) => (
            <SpecimenCard key={s.id} state={s} options={options} index={i} />
          ))}
        </section>

        <section className="mb-16">
          <div className="flex items-baseline justify-between flex-wrap gap-3 mb-4">
            <h2 className="font-display italic text-2xl text-bark">
              Avant <span className="text-stem">·</span> Après
            </h2>
            <div className="flex gap-1.5">
              {STATES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setCompareId(s.id)}
                  className={`text-[11px] font-mono px-2.5 py-1 rounded-full transition-colors ${
                    compareId === s.id
                      ? "bg-bark text-paper"
                      : "bg-mist text-stem hover:bg-sage-pale"
                  }`}
                >
                  {s.label.toLowerCase()}
                </button>
              ))}
            </div>
          </div>
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${paused ? "jp-paused" : ""}`}>
            <ComparePanel title="Plant.jsx · statique" muted>
              <Plant
                status={compare.staticStatus}
                mastery={compare.legacyMastery}
                size={110}
              />
            </ComparePanel>
            <ComparePanel title="PlantAnimated.jsx · vivant">
              <div className="w-40 h-48">
                <compare.Comp pot={pot} halo={halo} />
              </div>
            </ComparePanel>
          </div>
        </section>

        <footer className="text-[11px] font-mono text-twig text-center pb-4">
          Réservé au développement. Bascule le pot, le halo, ou fige les animations.
          <br />
          Inspiration : <code className="text-stem">components/ui/Loader.jsx</code>.
        </footer>
      </Page>
    </AppShell>
  )
}
