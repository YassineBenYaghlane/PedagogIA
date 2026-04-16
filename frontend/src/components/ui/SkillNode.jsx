import { Handle, Position } from "@xyflow/react"

const PLANT_STATE = {
  completed: "floraison",
  in_progress: "croissance",
  locked: "sommeil",
}

const STATE_LABEL = {
  floraison: "Floraison",
  croissance: "En croissance",
  arroser: "À arroser",
  sommeil: "En sommeil",
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

export default function SkillNode({ data }) {
  const { label, colors, status, isNext, family } = data
  const baseState = PLANT_STATE[status] ?? "sommeil"
  const state = isNext ? "arroser" : baseState

  const ringClass = state === "arroser" ? "border-sky-deep" : "border-transparent"
  const opacity = state === "sommeil" ? 0.75 : 1

  return (
    <div className="relative flex flex-col items-center" style={{ width: 140, opacity }}>
      {isNext && (
        <div className="absolute -top-7 chip chip-sky whitespace-nowrap z-10 !text-[10px]">
          À arroser aujourd'hui
        </div>
      )}
      <div
        className={`specimen ${ringClass} cursor-pointer transition-transform hover:-translate-y-0.5 w-full px-3 pt-3 pb-2`}
        style={{
          borderWidth: state === "arroser" ? 2 : 1,
        }}
      >
        <div
          className="rounded-md h-14 flex items-center justify-center"
          style={{ backgroundColor: `${colors.bg}90` }}
        >
          <svg viewBox="0 0 32 32" className="w-9 h-9">
            {PLANT_SVG[state]}
          </svg>
        </div>
        <div className="mt-2 text-center">
          <div className="text-[11px] font-semibold leading-tight text-bark">{label}</div>
          <div className="latin text-[9px] leading-tight mt-0.5">{family}</div>
        </div>
      </div>
      <div className="mt-1 text-[9px] font-semibold uppercase tracking-wider" style={{ color: colors.text }}>
        {STATE_LABEL[state]}
      </div>
      <Handle type="target" position={Position.Top} className="!opacity-0 !bg-transparent" />
      <Handle type="source" position={Position.Bottom} className="!opacity-0 !bg-transparent" />
    </div>
  )
}
