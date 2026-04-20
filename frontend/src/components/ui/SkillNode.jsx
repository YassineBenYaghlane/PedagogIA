import { useContext } from "react"
import { Handle, Position } from "@xyflow/react"
import { SkillTreeHoverContext } from "../../lib/skillTreeHoverContext"
import { SENTIER_LABEL } from "../../lib/skillStatus"
import Plant from "./Plant"

const STATE_LABEL = SENTIER_LABEL

function LockIcon() {
  return (
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
  )
}

export default function SkillNode({ id, data }) {
  const { hoveredId, prereqs } = useContext(SkillTreeHoverContext)
  const isPrereqOfHover = prereqs.has(id)
  const isHoverTarget = hoveredId === id
  const {
    label,
    status,
    isToday = false,
    masteryLevel = 0,
    totalAttempts = 0,
    unlocked = true,
  } = data

  // Normalize to Sentier-flavoured states.
  let sentierStatus = "locked"
  if (status === "completed") sentierStatus = "done"
  else if (status === "in_progress") sentierStatus = "in_progress"
  else if (status === "review") sentierStatus = "wilted"
  else if (unlocked) sentierStatus = totalAttempts > 0 ? "in_progress" : "unlocked"

  const showDashed = isToday || sentierStatus === "wilted"
  const showHalo = isToday || sentierStatus === "wilted"
  const haloVariant = sentierStatus === "wilted" ? "rose" : "honey"
  const dashedVariant = sentierStatus === "wilted" ? "rose" : "honey"

  const isLocked = sentierStatus === "locked"
  const pct = Math.round(masteryLevel * 100)

  const bodyModifier =
    sentierStatus === "done"
      ? "is-done"
      : sentierStatus === "wilted"
        ? "is-wilted"
        : isToday
          ? "is-today"
          : sentierStatus === "in_progress"
            ? "is-in-progress"
            : sentierStatus === "unlocked"
              ? "is-unlocked"
              : "is-locked"

  const labelModifier =
    sentierStatus === "done"
      ? "is-done"
      : sentierStatus === "wilted"
        ? "is-wilted"
        : isToday
          ? "is-today"
          : ""

  const plantSize = isToday ? 58 : 50
  const dim = sentierStatus === "locked" && totalAttempts === 0

  return (
    <div
      className="disc-root group"
      style={{ width: 140, opacity: dim && !isPrereqOfHover && !isHoverTarget ? 0.8 : 1 }}
    >
      <div
        className="relative"
        style={{ width: isToday ? 108 : 92, height: isToday ? 108 : 92 }}
      >
        {showHalo && <span className={`disc-halo ${haloVariant}`} />}
        {showDashed && <span className={`disc-dashed ${dashedVariant}`} />}
        <div
          className={`disc-body ${bodyModifier}`}
          style={{ width: "100%", height: "100%" }}
        >
          <Plant status={sentierStatus} mastery={masteryLevel} size={plantSize} />
          {isLocked && (
            <div
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-paper border border-sage/25 flex items-center justify-center text-stem"
              title="Pas encore accessible"
            >
              <LockIcon />
            </div>
          )}
        </div>
      </div>
      <span className={`disc-label ${labelModifier}`} title={label}>
        {label}
      </span>
      {totalAttempts > 0 && sentierStatus !== "done" && (
        <span className="disc-mini">{pct}%</span>
      )}
      {isToday && sentierStatus !== "wilted" && (
        <span className="disc-mini" style={{ color: "#8a6a1f" }}>
          · à pratiquer aujourd'hui ·
        </span>
      )}
      {totalAttempts === 0 && sentierStatus === "unlocked" && !isToday && (
        <span className="disc-mini">{STATE_LABEL[sentierStatus]}</span>
      )}
      <Handle type="target" position={Position.Top} className="!opacity-0 !bg-transparent" />
      <Handle type="source" position={Position.Bottom} className="!opacity-0 !bg-transparent" />
    </div>
  )
}
