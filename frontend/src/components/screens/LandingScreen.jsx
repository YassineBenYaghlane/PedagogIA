import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import AppShell from "../layout/AppShell"
import Button from "../ui/Button"
import Card from "../ui/Card"
import Logo from "../ui/Logo"
import { Heading, LatinLabel } from "../ui/Heading"

const ROTATING_WORDS = [
  "sur mesure",
  "guidé par l'IA",
  "à ton rythme",
  "pour chaque élève",
]

const RITUAL = [
  {
    latin: "Diagnosis",
    title: "On repère",
    body: "Quelques exercices suffisent à situer l'élève dans l'arbre des compétences.",
  },
  {
    latin: "Exercitatio",
    title: "On arrose",
    body: "Des exercices choisis par l'IA pour la compétence qui en a besoin.",
  },
  {
    latin: "Hortus liber",
    title: "On laisse pousser",
    body: "La pratique libre s'adapte, la mémoire s'entretient, la maîtrise vient.",
  },
]

function Leaf({ className, style }) {
  return (
    <svg viewBox="0 0 64 64" className={className} style={style} aria-hidden="true">
      <path
        d="M32 4C14 14 4 28 4 44c0 10 8 16 18 16 18 0 38-16 38-40 0-6-2-12-6-16-6 4-14 6-22 0z"
        fill="rgba(198, 224, 181, 0.55)"
        stroke="rgba(111, 162, 116, 0.45)"
        strokeWidth="1.2"
      />
      <path
        d="M10 54c10-14 22-26 38-38"
        stroke="rgba(63, 111, 74, 0.35)"
        strokeWidth="1.2"
        fill="none"
      />
    </svg>
  )
}

function Spore({ left, delay }) {
  return (
    <span
      aria-hidden="true"
      className="spore absolute bottom-8 h-1.5 w-1.5 rounded-full bg-sage/50"
      style={{ left, animationDelay: delay }}
    />
  )
}

function RotatingWord() {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % ROTATING_WORDS.length)
    }, 2600)
    return () => clearInterval(id)
  }, [])

  return (
    <span className="relative inline-block align-baseline">
      <span className="invisible whitespace-nowrap">
        {ROTATING_WORDS.reduce((a, b) => (a.length > b.length ? a : b))}
      </span>
      {ROTATING_WORDS.map((word, i) => (
        <span
          key={word}
          aria-hidden={i !== index}
          className="absolute inset-0 whitespace-nowrap text-sage-deep"
          style={{
            animation: i === index ? "word-fade 2.6s ease-in-out" : "none",
            opacity: i === index ? 1 : 0,
          }}
        >
          {word}
        </span>
      ))}
    </span>
  )
}

function Hero({ onStart, onLogin }) {
  return (
    <section className="relative overflow-hidden paper-grid">
      <div className="hero-halo" aria-hidden="true" />
      <Leaf className="leaf-a absolute top-10 left-8 w-16 md:w-24 opacity-80" />
      <Leaf
        className="leaf-b absolute top-24 right-10 w-14 md:w-20 opacity-70"
        style={{ transform: "scaleX(-1)" }}
      />
      <Leaf className="leaf-c absolute bottom-20 left-16 w-10 md:w-14 opacity-60" />
      <Spore left="22%" delay="0s" />
      <Spore left="48%" delay="1.8s" />
      <Spore left="72%" delay="3.4s" />
      <Spore left="88%" delay="0.9s" />

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-20 sm:px-10 sm:py-24 md:py-32 text-center">
        <div
          className="hero-rise flex justify-center mb-6"
          style={{ animationDelay: "0ms" }}
        >
          <Logo size="lg" />
        </div>
        <div className="hero-rise" style={{ animationDelay: "80ms" }}>
          <LatinLabel>Hortus Mathematicus</LatinLabel>
        </div>

        <Heading
          level={1}
          className="hero-rise mt-4 leading-[1.02] text-4xl sm:text-6xl md:text-7xl"
          style={{ animationDelay: "120ms" }}
        >
          Un parcours{" "}
          <RotatingWord />
          <br />
          pour cultiver les maths.
        </Heading>

        <p
          className="hero-rise mx-auto mt-6 max-w-2xl text-stem text-base sm:text-lg leading-relaxed"
          style={{ animationDelay: "260ms" }}
        >
          CollegIA observe chaque erreur, comprend la racine du blocage, et choisit
          la prochaine compétence à arroser. Une IA qui jardine l'esprit, à ton rythme
          — de la P1 à la P6.
        </p>

        <div
          className="hero-rise mt-8 flex flex-col sm:flex-row gap-3 justify-center items-center"
          style={{ animationDelay: "420ms" }}
        >
          <Button size="lg" onClick={onStart}>
            Commencer à apprendre
            <svg
              className="inline-block ml-2 -mr-0.5"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M5 12h14M13 5l7 7-7 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Button>
          <button
            type="button"
            onClick={onLogin}
            className="text-sm text-stem hover:text-bark underline decoration-sage decoration-2 underline-offset-4"
          >
            J'ai déjà un compte
          </button>
        </div>

        <div
          className="hero-rise mt-10 flex flex-wrap justify-center items-center gap-x-5 gap-y-2 text-xs text-stem"
          style={{ animationDelay: "560ms" }}
        >
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-sage" aria-hidden="true" />
            Référentiel FWB
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-deep" aria-hidden="true" />
            Claude · IA pédagogique
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-honey" aria-hidden="true" />
            6 — 12 ans
          </span>
        </div>
      </div>
    </section>
  )
}

function Ritual() {
  return (
    <section className="relative mx-auto max-w-5xl px-6 py-20 sm:px-10 md:py-28">
      <div className="text-center space-y-2 mb-12">
        <LatinLabel>Modus operandi</LatinLabel>
        <Heading level={2}>Un rituel en trois gestes</Heading>
        <p className="text-stem max-w-xl mx-auto">
          Chaque compétence est une plante. Chaque séance, un geste de jardinier.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {RITUAL.map((step, i) => (
          <Card
            key={step.title}
            variant="specimen"
            className="p-6 space-y-3"
          >
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-sage-leaf text-sage-deep font-display text-sm"
              >
                {i + 1}
              </span>
              <LatinLabel>{step.latin}</LatinLabel>
            </div>
            <Heading level={4}>{step.title}</Heading>
            <p className="text-stem text-sm leading-relaxed">{step.body}</p>
          </Card>
        ))}
      </div>
    </section>
  )
}

function Closer({ onStart }) {
  return (
    <section className="relative mx-auto max-w-3xl px-6 pb-24 sm:px-10 text-center">
      <div className="specimen p-10 space-y-5">
        <LatinLabel>Ad florem</LatinLabel>
        <Heading level={3}>Prêt à planter la première graine&nbsp;?</Heading>
        <p className="text-stem max-w-xl mx-auto">
          Crée un profil pour ton enfant et laisse le jardin s'occuper du reste.
        </p>
        <div className="pt-2">
          <Button size="lg" onClick={onStart}>
            Commencer à apprendre
          </Button>
        </div>
      </div>
    </section>
  )
}

export default function LandingScreen() {
  const navigate = useNavigate()
  return (
    <AppShell surface="greenhouse">
      <Hero
        onStart={() => navigate("/register")}
        onLogin={() => navigate("/login")}
      />
      <Ritual />
      <Closer onStart={() => navigate("/register")} />
    </AppShell>
  )
}
