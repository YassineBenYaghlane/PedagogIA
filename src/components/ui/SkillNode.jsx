import { Handle, Position } from "@xyflow/react"

const STATUS_STYLES = {
  completed: {
    ring: "solid",
    ringWidth: 2,
    opacity: 1,
  },
  in_progress: {
    ring: "dashed",
    ringWidth: 3,
    opacity: 1,
  },
  locked: {
    ring: "solid",
    ringWidth: 2,
    opacity: 0.6,
  },
}

export default function SkillNode({ data }) {
  const { label, colors, icon, status, isNext } = data
  const styles = STATUS_STYLES[status]
  const locked = status === "locked"
  const bg = locked ? "#edeef5" : colors.bg
  const border = locked ? "#b0b5c9" : colors.border
  const textColor = locked ? "#8890a8" : colors.text

  return (
    <div className="relative flex flex-col items-center" style={{ width: 140 }}>
      {isNext && (
        <div className="absolute -top-7 px-2.5 py-1 rounded-full text-[10px] font-bold bg-tertiary text-on-tertiary shadow-ambient-sm whitespace-nowrap z-10">
          Prochaine étape
        </div>
      )}
      <div
        className="flex items-center justify-center rounded-full cursor-pointer shadow-ambient-sm transition-transform hover:scale-105"
        style={{
          width: 92,
          height: 92,
          background: bg,
          border: `${styles.ringWidth}px ${styles.ring} ${border}`,
          opacity: styles.opacity,
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{ color: textColor, fontSize: 38 }}
        >
          {icon}
        </span>
      </div>
      <div
        className="mt-2 text-center text-[11px] font-semibold leading-tight px-1"
        style={{ color: locked ? "#8890a8" : "#1a1f3a" }}
      >
        {label}
      </div>
      <Handle type="target" position={Position.Top} className="!opacity-0 !bg-transparent" />
      <Handle type="source" position={Position.Bottom} className="!opacity-0 !bg-transparent" />
    </div>
  )
}
