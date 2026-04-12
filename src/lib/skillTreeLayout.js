import { MarkerType } from "@xyflow/react"

export const GRADES = ["P1", "P2", "P3", "P4", "P5", "P6"]

export const GRADE_COLORS = {
  P1: { bg: "#c9f7e3", border: "#00694b", text: "#00694b", minimap: "#00694b" },
  P2: { bg: "#ffe89a", border: "#8a6d00", text: "#8a6d00", minimap: "#8a6d00" },
  P3: { bg: "#b8d1ff", border: "#0059b6", text: "#0059b6", minimap: "#0059b6" },
  P4: { bg: "#e9d2ff", border: "#7b3d96", text: "#7b3d96", minimap: "#7b3d96" },
  P5: { bg: "#ffd4b8", border: "#b64600", text: "#b64600", minimap: "#b64600" },
  P6: { bg: "#dde2ff", border: "#505a81", text: "#505a81", minimap: "#505a81" },
}

const ICON_BY_PREFIX = [
  ["num_", "123"],
  ["add_", "add"],
  ["soustr_", "remove"],
  ["mult_", "close"],
  ["div_", "percent"],
  ["prop_", "swap_horiz"],
  ["cm_", "psychology"],
  ["ce_", "edit_note"],
  ["estimation_", "query_stats"],
]

function iconFor(id) {
  for (const [prefix, icon] of ICON_BY_PREFIX) {
    if (id.startsWith(prefix)) return icon
  }
  return "school"
}

function mockStatus(skill) {
  if (skill.grade === "P1") return "completed"
  if (skill.grade === "P2") return "in_progress"
  return "locked"
}

export const NODE_WIDTH = 140
export const NODE_GAP_X = 24
export const SUBROW_HEIGHT = 170
export const BAND_GAP = 60
export const BAND_PAD_TOP = 40
const LANE_LABEL_X = -180

function computeDepth(skills) {
  const byId = new Map(skills.map((s) => [s.id, s]))
  const depth = new Map()
  const visit = (id) => {
    if (depth.has(id)) return depth.get(id)
    const s = byId.get(id)
    if (!s || s.prerequisites.length === 0) {
      depth.set(id, 0)
      return 0
    }
    depth.set(id, 0)
    const d = 1 + Math.max(...s.prerequisites.map(visit), -1)
    depth.set(id, d)
    return d
  }
  for (const s of skills) visit(s.id)
  return depth
}

function orderByBarycenter(skills, positions, successors, useSuccessors) {
  const withBary = skills.map((s) => {
    const neighbors = useSuccessors
      ? [...s.prerequisites, ...(successors.get(s.id) ?? [])]
      : s.prerequisites
    const xs = neighbors.map((id) => positions.get(id)?.x).filter((x) => x !== undefined)
    const bary = xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : Number.POSITIVE_INFINITY
    return { s, bary }
  })
  withBary.sort((a, b) => {
    if (a.bary === Number.POSITIVE_INFINITY && b.bary === Number.POSITIVE_INFINITY) {
      return a.s.id.localeCompare(b.s.id)
    }
    if (a.bary === Number.POSITIVE_INFINITY) return 1
    if (b.bary === Number.POSITIVE_INFINITY) return -1
    return a.bary - b.bary
  })
  return withBary.map(({ s }) => s)
}

export function buildGraph(skills, nextId) {
  const byGrade = new Map(GRADES.map((g) => [g, []]))
  for (const s of skills) {
    if (byGrade.has(s.grade)) byGrade.get(s.grade).push(s)
  }

  const successors = new Map()
  for (const s of skills) {
    for (const p of s.prerequisites) {
      if (!successors.has(p)) successors.set(p, [])
      successors.get(p).push(s.id)
    }
  }

  const depth = computeDepth(skills)

  const gradeInfo = new Map()
  for (const grade of GRADES) {
    const gs = byGrade.get(grade)
    if (!gs.length) {
      gradeInfo.set(grade, { rows: new Map(), rowCount: 0 })
      continue
    }
    const depths = gs.map((s) => depth.get(s.id))
    const minD = Math.min(...depths)
    const maxD = Math.max(...depths)
    const rows = new Map()
    for (const s of gs) {
      const r = depth.get(s.id) - minD
      if (!rows.has(r)) rows.set(r, [])
      rows.get(r).push(s)
    }
    gradeInfo.set(grade, { minD, rows, rowCount: maxD - minD + 1 })
  }

  const gradeYStart = new Map()
  const gradeYEnd = new Map()
  let yAcc = BAND_PAD_TOP
  for (const grade of GRADES) {
    gradeYStart.set(grade, yAcc)
    const info = gradeInfo.get(grade)
    const h = Math.max(info.rowCount, 1) * SUBROW_HEIGHT
    yAcc += h
    gradeYEnd.set(grade, yAcc)
    yAcc += BAND_GAP
  }

  const positions = new Map()
  const placeRow = (rowSkills, grade, r, useSucc) => {
    const ordered = orderByBarycenter(rowSkills, positions, successors, useSucc)
    ordered.forEach((s, i) => {
      positions.set(s.id, {
        x: i * (NODE_WIDTH + NODE_GAP_X),
        y: gradeYStart.get(grade) + r * SUBROW_HEIGHT,
      })
    })
  }

  for (const grade of GRADES) {
    const info = gradeInfo.get(grade)
    for (let r = 0; r < info.rowCount; r++) {
      placeRow(info.rows.get(r) ?? [], grade, r, false)
    }
  }
  for (let pass = 0; pass < 3; pass++) {
    for (const grade of [...GRADES].reverse()) {
      const info = gradeInfo.get(grade)
      for (let r = info.rowCount - 1; r >= 0; r--) {
        placeRow(info.rows.get(r) ?? [], grade, r, true)
      }
    }
    for (const grade of GRADES) {
      const info = gradeInfo.get(grade)
      for (let r = 0; r < info.rowCount; r++) {
        placeRow(info.rows.get(r) ?? [], grade, r, true)
      }
    }
  }

  const allX = [...positions.values()].map((p) => p.x)
  const maxX = allX.length ? Math.max(...allX) : 0

  const nodes = skills.map((s) => ({
    id: s.id,
    type: "skillNode",
    position: positions.get(s.id),
    data: {
      ...s,
      colors: GRADE_COLORS[s.grade],
      icon: iconFor(s.id),
      status: mockStatus(s),
      isNext: s.id === nextId,
    },
    draggable: false,
  }))

  const edges = skills.flatMap((s) =>
    s.prerequisites.map((pid) => ({
      id: `${pid}->${s.id}`,
      source: pid,
      target: s.id,
      type: "smoothstep",
      style: { stroke: "#c2c7dd", strokeWidth: 1.5, strokeDasharray: "6 6" },
      markerEnd: { type: MarkerType.ArrowClosed, color: "#c2c7dd", width: 14, height: 14 },
    }))
  )

  const laneNodes = GRADES.map((grade) => {
    const yStart = gradeYStart.get(grade)
    const yEnd = gradeYEnd.get(grade)
    return {
      id: `lane-${grade}`,
      type: "laneLabel",
      position: { x: LANE_LABEL_X, y: yStart - 20 },
      data: {
        grade,
        colors: GRADE_COLORS[grade],
        width: maxX + NODE_WIDTH + 220,
        height: yEnd - yStart + 40,
      },
      draggable: false,
      selectable: false,
    }
  })

  return { nodes: [...laneNodes, ...nodes], edges, successors }
}

export function collectRelated(id, skills, successors) {
  const byId = new Map(skills.map((s) => [s.id, s]))
  const ancestors = new Set()
  const stackA = [id]
  while (stackA.length) {
    const cur = stackA.pop()
    for (const p of byId.get(cur)?.prerequisites ?? []) {
      if (!ancestors.has(p)) {
        ancestors.add(p)
        stackA.push(p)
      }
    }
  }
  const descendants = new Set()
  const stackD = [id]
  while (stackD.length) {
    const cur = stackD.pop()
    for (const c of successors.get(cur) ?? []) {
      if (!descendants.has(c)) {
        descendants.add(c)
        stackD.push(c)
      }
    }
  }
  return { ancestors, descendants }
}
