export const GRADES = ["P1", "P2", "P3", "P4", "P5", "P6"]

export const GRADE_COLORS = {
  P1: { bg: "#D6E6D2", border: "#3F6F4A", text: "#3F6F4A", minimap: "#6FA274" },
  P2: { bg: "#C7E0B5", border: "#3F6F4A", text: "#3F6F4A", minimap: "#3F6F4A" },
  P3: { bg: "#DCEDF4", border: "#4F8BAC", text: "#2F6A88", minimap: "#4F8BAC" },
  P4: { bg: "#FBF1D6", border: "#8A6A1F", text: "#8A6A1F", minimap: "#E8C66A" },
  P5: { bg: "#F7DFDC", border: "#B7615C", text: "#B7615C", minimap: "#E8A6A1" },
  P6: { bg: "#ECF1E7", border: "#5C6B5F", text: "#2B3A2E", minimap: "#5C6B5F" },
}

const FAMILY_BY_PREFIX = [
  ["num_", "numeri"],
  ["add_", "additio"],
  ["soustr_", "subtractio"],
  ["mult_", "multiplicatio"],
  ["div_", "divisio"],
  ["prop_", "proportio"],
  ["cm_", "mens"],
  ["ce_", "scriptum"],
  ["estimation_", "aestimatio"],
]

function familyFor(id) {
  for (const [prefix, name] of FAMILY_BY_PREFIX) {
    if (id.startsWith(prefix)) return name
  }
  return "scientia"
}

const BACKEND_TO_UI_STATUS = {
  mastered: "completed",
  learning_easy: "in_progress",
  learning_medium: "in_progress",
  learning_hard: "in_progress",
  needs_review: "review",
  not_started: "locked"
}

function skillStatus(skill, stateById) {
  const state = stateById?.get(skill.id)
  if (!state) return "locked"
  return BACKEND_TO_UI_STATUS[state.status] ?? "locked"
}

export const NODE_WIDTH = 150
export const NODE_GAP_X = 36
export const SUBROW_HEIGHT = 200
export const BAND_GAP = 120
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

function pickTodayIds(skills, stateById, max = 2) {
  const score = (st) => {
    if (!st) return 0
    if (st.status === "needs_review") return 3
    if (st.status === "learning_hard") return 2.5
    if (st.status === "learning_medium") return 2
    if (st.status === "learning_easy") return 1.5
    return 0
  }
  const candidates = skills
    .map((s) => ({ id: s.id, score: score(stateById?.get(s.id)) }))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
  return new Set(candidates.slice(0, max).map((c) => c.id))
}

export function buildGraph(skills, nextId, stateById) {
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

  let maxRowSize = 1
  for (const grade of GRADES) {
    const info = gradeInfo.get(grade)
    for (let r = 0; r < info.rowCount; r++) {
      const sz = (info.rows.get(r) ?? []).length
      if (sz > maxRowSize) maxRowSize = sz
    }
  }
  const stride = NODE_WIDTH + NODE_GAP_X
  const rowCenter = (maxRowSize * stride - NODE_GAP_X) / 2

  const positions = new Map()
  const placeRow = (rowSkills, grade, r, useSucc) => {
    const ordered = orderByBarycenter(rowSkills, positions, successors, useSucc)
    if (!ordered.length) return
    const rowWidth = ordered.length * stride - NODE_GAP_X
    const startX = rowCenter - rowWidth / 2
    ordered.forEach((s, i) => {
      positions.set(s.id, {
        x: startX + i * stride,
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

  const isMastered = (id) => stateById?.get(id)?.status === "mastered"
  const hasAttempts = (id) => (stateById?.get(id)?.total_attempts ?? 0) > 0
  const isUnlocked = (s) =>
    hasAttempts(s.id) ||
    s.prerequisites.length === 0 ||
    s.prerequisites.every(isMastered)

  const todayIds = pickTodayIds(skills, stateById)
  const edges = []

  const nodes = skills.map((s) => {
    const state = stateById?.get(s.id)
    return {
      id: s.id,
      type: "skillNode",
      position: positions.get(s.id),
      data: {
        ...s,
        colors: GRADE_COLORS[s.grade],
        family: familyFor(s.id),
        status: skillStatus(s, stateById),
        masteryLevel: state?.mastery_level ?? 0,
        totalAttempts: state?.total_attempts ?? 0,
        unlocked: isUnlocked(s),
        isNext: s.id === nextId,
        isToday: todayIds.has(s.id) || s.id === nextId,
      },
      draggable: false,
    }
  })


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
      style: { pointerEvents: "none" },
    }
  })

  const lastGrade = GRADES[GRADES.length - 1]
  const bounds = {
    minX: LANE_LABEL_X,
    maxX: maxX + NODE_WIDTH + 40,
    minY: 0,
    maxY: gradeYEnd.get(lastGrade) + 40,
  }

  return { nodes: [...laneNodes, ...nodes], edges, bounds }
}
