import { Handle, Position } from "@xyflow/react"

export default function SkillNode({ data }) {
  const { label, grade, colors } = data

  return (
    <div
      className="rounded-lg px-3 py-2 text-center cursor-pointer shadow-ambient-sm transition-shadow hover:shadow-ambient"
      style={{
        width: 220,
        backgroundColor: colors.bg,
        border: `1.5px solid ${colors.border}`,
      }}
    >
      <div className="flex items-center gap-1.5">
        <span
          className="text-[10px] font-bold shrink-0 px-1 py-px rounded"
          style={{ backgroundColor: colors.border, color: colors.bg }}
        >
          {grade}
        </span>
        <span
          className="text-xs font-medium truncate"
          style={{ color: colors.text }}
        >
          {label}
        </span>
      </div>
      <Handle type="target" position={Position.Top} className="!bg-outline !w-2 !h-2" />
      <Handle type="source" position={Position.Bottom} className="!bg-outline !w-2 !h-2" />
    </div>
  )
}
