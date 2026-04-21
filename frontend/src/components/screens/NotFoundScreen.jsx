import { Link } from "react-router"
import AppShell from "../layout/AppShell"
import Page from "../layout/Page"
import AnimatedPlant, { PlantKeyframes } from "../ui/PlantAnimated"

function DriftingLeaf({ className, style }) {
  return (
    <svg
      viewBox="0 0 48 24"
      className={`absolute pointer-events-none ${className}`}
      style={style}
      aria-hidden="true"
    >
      <ellipse cx="24" cy="12" rx="20" ry="7.5" fill="#C7E0B5" stroke="#3F6F4A" strokeWidth="1.2" />
      <path
        d="M4 12 Q 24 10 44 12"
        stroke="#3F6F4A"
        strokeWidth="0.8"
        fill="none"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  )
}

function Spore({ style }) {
  return (
    <span
      className="spore absolute block rounded-full bg-sage-leaf/60 pointer-events-none"
      style={style}
      aria-hidden="true"
    />
  )
}

export default function NotFoundScreen() {
  return (
    <AppShell surface="greenhouse">
      <PlantKeyframes />
      <Page maxWidth="2xl">
        <section className="relative flex flex-col items-center justify-center py-12 md:py-16 min-h-[70vh]">
          <div className="hero-halo" aria-hidden="true" />

          <DriftingLeaf
            className="leaf-a"
            style={{ top: "6%", left: "8%", width: 44, transform: "rotate(-18deg)", opacity: 0.7 }}
          />
          <DriftingLeaf
            className="leaf-b"
            style={{ top: "18%", right: "10%", width: 36, transform: "rotate(22deg)", opacity: 0.6 }}
          />
          <DriftingLeaf
            className="leaf-c"
            style={{ bottom: "14%", left: "14%", width: 30, transform: "rotate(-8deg)", opacity: 0.55 }}
          />
          <DriftingLeaf
            className="leaf-a"
            style={{ bottom: "24%", right: "16%", width: 26, transform: "rotate(12deg)", opacity: 0.5 }}
          />

          <Spore style={{ top: "28%", left: "22%", width: 5, height: 5, animationDelay: "0s" }} />
          <Spore style={{ top: "40%", right: "24%", width: 4, height: 4, animationDelay: "1.8s" }} />
          <Spore style={{ bottom: "30%", left: "30%", width: 6, height: 6, animationDelay: "3.2s" }} />
          <Spore style={{ bottom: "18%", right: "30%", width: 4, height: 4, animationDelay: "4.6s" }} />

          <div className="hero-rise relative text-[11px] tracking-[0.28em] uppercase text-stem font-mono mb-4">
            Planche égarée · n° 4‑0‑4
          </div>

          <div
            className="hero-rise relative mb-6"
            style={{ animationDelay: "120ms" }}
          >
            <div className="flex items-center justify-center" style={{ width: 180, height: 210 }}>
              <AnimatedPlant status="wilted" pot halo drops pollen />
            </div>
          </div>

          <h1
            className="hero-rise relative font-display italic font-semibold text-bark text-center leading-none"
            style={{ animationDelay: "220ms" }}
            aria-label="Erreur 404"
          >
            <span className="block text-7xl md:text-9xl tabular-nums">
              <span className="notfound-digit notfound-digit-a">4</span>
              <span className="notfound-digit notfound-digit-b mx-2 md:mx-3">0</span>
              <span className="notfound-digit notfound-digit-c">4</span>
            </span>
          </h1>

          <div
            className="hero-rise relative flex items-center gap-3 mt-4 mb-3"
            style={{ animationDelay: "320ms" }}
          >
            <span className="h-px w-10 bg-sage/30" />
            <span className="text-[11px] font-mono tracking-[0.22em] uppercase text-stem">
              sentier perdu
            </span>
            <span className="h-px w-10 bg-sage/30" />
          </div>

          <p
            className="hero-rise relative font-display italic text-2xl md:text-3xl text-bark text-center max-w-lg mb-3 leading-tight"
            style={{ animationDelay: "400ms" }}
          >
            Ce sentier s'arrête là.
          </p>

          <p
            className="hero-rise relative text-sm md:text-base text-stem text-center max-w-md mb-8 leading-relaxed"
            style={{ animationDelay: "480ms" }}
          >
            La page que tu cherchais ne pousse pas ici — ou plus.
            <br className="hidden md:block" /> Le jardinier a laissé la parcelle en friche.
          </p>

          <div
            className="hero-rise relative flex flex-wrap items-center justify-center gap-3"
            style={{ animationDelay: "560ms" }}
          >
            <Link to="/" className="pill">
              Retour à la serre
            </Link>
            <Link to="/skill-tree" className="pill pill-ghost">
              Voir la carte
            </Link>
          </div>

          <div
            className="hero-rise relative mt-12 text-[10px] font-mono tracking-[0.22em] uppercase text-twig"
            style={{ animationDelay: "640ms" }}
          >
            Jardin de CollegIA · carnet des sentiers
          </div>
        </section>
      </Page>

      <style>{`
        @keyframes notfound-bob {
          0%, 100% { transform: translateY(0) rotate(0) }
          50%      { transform: translateY(-7px) rotate(-1.5deg) }
        }
        @keyframes notfound-bob-alt {
          0%, 100% { transform: translateY(-3px) rotate(1deg) }
          50%      { transform: translateY(4px) rotate(-1deg) }
        }
        .notfound-digit {
          display: inline-block;
          will-change: transform;
        }
        .notfound-digit-a { animation: notfound-bob 3.8s ease-in-out 0s infinite; color: #3F6F4A }
        .notfound-digit-b { animation: notfound-bob-alt 3.2s ease-in-out 0.25s infinite; color: #B7615C }
        .notfound-digit-c { animation: notfound-bob 3.8s ease-in-out 0.5s infinite; color: #3F6F4A }
        @media (prefers-reduced-motion: reduce) {
          .notfound-digit { animation: none }
        }
      `}</style>
    </AppShell>
  )
}
