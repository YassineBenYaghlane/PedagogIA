import { useContext } from "react"
import { Handle, Position } from "@xyflow/react"
import { SkillTreeHoverContext } from "../../lib/skillTreeHoverContext"

const PLANT_STATE = {
  completed: "floraison",
  in_progress: "croissance",
  review: "arroser",
  locked: "sommeil",
}

const STATE_LABEL = {
  floraison: "Floraison",
  croissance: "En croissance",
  arroser: "À arroser",
  sommeil: "En sommeil",
}

const STATE_LATIN = {
  floraison: "en fleurs",
  croissance: "en croissance",
  arroser: "à revoir",
  sommeil: "en sommeil",
}

const PLANT_SVG = {
  sommeil: (
    <g fill="none" stroke="#A1AEA3" strokeWidth="1.4" strokeLinecap="round">
      <path d="M16 28V18" strokeDasharray="2 3" />
      <circle cx="16" cy="14" r="2.5" fill="#A1AEA3" opacity="0.35" />
    </g>
  ),
  arroser: (
    <g fill="none" stroke="#4F8BAC" strokeWidth="1.5" strokeLinecap="round">
      <path d="M16 28V12" />
      <path d="M16 19c-3 0-5-2-5-5 3 0 5 2 5 5z" />
    </g>
  ),
  croissance: (
    <g fill="none" stroke="#3F6F4A" strokeWidth="1.6" strokeLinecap="round">
      <path d="M16 28V8" />
      <path d="M16 17c-4 0-6-2-6-5 4 0 6 2 6 5z" fill="#C7E0B5" />
      <path d="M16 12c4 0 6-2 6-5-4 0-6 2-6 5z" fill="#C7E0B5" />
    </g>
  ),
  floraison: (
    <g fill="none" strokeWidth="1.3" strokeLinecap="round">
      <path d="M16 28V14" stroke="#3F6F4A" strokeWidth="1.5" />
      <circle cx="12" cy="10" r="3" fill="#E8A6A1" stroke="#B7615C" />
      <circle cx="20" cy="10" r="3" fill="#E8A6A1" stroke="#B7615C" />
      <circle cx="16" cy="6" r="3" fill="#E8A6A1" stroke="#B7615C" />
      <circle cx="16" cy="10" r="2.4" fill="#E8C66A" stroke="#8A6A1F" />
    </g>
  ),
}

export default function SkillNode({ id, data }) {
  const { hoveredId, prereqs } = useContext(SkillTreeHoverContext)
  const isPrereqOfHover = prereqs.has(id)
  const isHoverTarget = hoveredId === id
  const {
    label, status, isNext, family,
    masteryLevel = 0, totalAttempts = 0, unlocked = true,
  } = data
  const baseState = PLANT_STATE[status] ?? "sommeil"
  const state = isNext && status !== "completed" ? "arroser" : baseState
  const pct = Math.round(masteryLevel * 100)
  const isLocked = !unlocked
  const isBloom = state === "floraison"
  const isCroissance = state === "croissance"

  const cardStyle = {}
  if (state === "floraison") {
    cardStyle.background = "#3F6F4A"
    cardStyle.borderColor = "transparent"
  } else if (isCroissance) {
    cardStyle.borderColor = "#6FA274"
    cardStyle.borderWidth = 2
  } else if (state === "arroser") {
    cardStyle.borderColor = "#4F8BAC"
    cardStyle.borderWidth = 2
  }

  const dim = state === "sommeil" && totalAttempts === 0
  const barFill = state === "arroser" ? "#4F8BAC" : "#6FA274"

  return (
    <div
      className="group relative flex flex-col items-center"
      style={{ width: 140, opacity: dim && !isPrereqOfHover && !isHoverTarget ? 0.75 : 1 }}
    >
      {isNext && state !== "floraison" && (
        <div className="absolute -top-7 chip chip-sky whitespace-nowrap z-10 !text-[10px]">
          À arroser aujourd'hui
        </div>
      )}
      {isCroissance && !isNext && (
        <div className="absolute -top-7 chip whitespace-nowrap z-10 !text-[10px] bg-sage-leaf text-sage-deep border border-sage/30">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-sage-deep" />
          Tu travailles ici
        </div>
      )}
      {isLocked && (
        <div
          className="absolute top-1.5 right-1.5 z-20 w-5 h-5 rounded-full bg-paper border border-sage/25 flex items-center justify-center text-stem pointer-events-none"
          aria-label="Compétence verrouillée"
          title="Pas encore accessible — touche pour voir les racines manquantes"
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="4" y="11" width="16" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
        </div>
      )}
      {isPrereqOfHover && (
        <div className="absolute inset-0 rounded-[0.875rem] pointer-events-none prereq-glow z-0" />
      )}
      <div
        className={`specimen relative w-full px-3 pt-3 pb-2.5 transition-transform duration-200 origin-center group-hover:scale-[1.06] group-hover:z-10 cursor-pointer ${isCroissance ? "specimen-croissance" : ""}`}
        style={cardStyle}
      >
        <div
          className="rounded-md h-11 flex items-center justify-center"
          style={{ backgroundColor: isBloom ? "rgba(255,255,255,0.1)" : "rgba(198,224,181,0.35)" }}
        >
          <svg viewBox="0 0 32 32" className="w-7 h-7">
            {PLANT_SVG[state]}
          </svg>
        </div>
        <div className="mt-2 text-center">
          <div
            className="text-[11px] font-semibold leading-tight"
            style={{ color: isBloom ? "#ffffff" : "#2B3A2E" }}
          >
            {label}
          </div>
          <div
            className="latin text-[9px] leading-tight mt-0.5"
            style={{ color: isBloom ? "rgba(255,255,255,0.75)" : undefined }}
          >
            {family} · {totalAttempts > 0 ? `${pct}%` : STATE_LATIN[state]}
          </div>
        </div>
        <div
          className="mt-2 h-1 rounded-full overflow-hidden"
          style={{ background: isBloom ? "rgba(255,255,255,0.25)" : "#ECF1E7" }}
        >
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${Math.max(isBloom ? 100 : pct, 0)}%`,
              background: isBloom ? "#E8C66A" : barFill
            }}
          />
        </div>
      </div>
      <div
        className="mt-1 text-[9px] font-semibold uppercase tracking-wider"
        style={{ color: state === "arroser" ? "#4F8BAC" : state === "floraison" ? "#8A6A1F" : "#5C6B5F" }}
      >
        {STATE_LABEL[state]}
      </div>
      <Handle type="target" position={Position.Top} className="!opacity-0 !bg-transparent" />
      <Handle type="source" position={Position.Bottom} className="!opacity-0 !bg-transparent" />
    </div>
  )
}
