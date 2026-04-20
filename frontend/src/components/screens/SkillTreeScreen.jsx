import { useState, useCallback, useEffect, useMemo, useRef } from "react"
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { useNavigate } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { api } from "../../api/client"
import { useAuthStore } from "../../stores/authStore"
import { useSkillTree } from "../../hooks/useSkillTree"
import AppShell from "../layout/AppShell"
import SkillNode from "../ui/SkillNode"
import Plant from "../ui/Plant"
import Button from "../ui/Button"
import Card from "../ui/Card"
import Input from "../ui/Input"
import { LatinLabel } from "../ui/Heading"
import { levelDescriptions, levelLatin, levelVernacular } from "../../lib/constants"
import { GRADES, buildGraph } from "../../lib/skillTreeLayout"
import { SkillTreeHoverContext } from "../../lib/skillTreeHoverContext"

const EMPTY_SET = new Set()
const MOBILE_BREAKPOINT = 768

function LaneLabel({ data }) {
  const { grade, colors, width, height } = data
  return (
    <div className="pointer-events-none relative" style={{ width, height }}>
      <div
        className="absolute inset-0 rounded-2xl"
        style={{ backgroundColor: colors.bg, opacity: 0.45 }}
      />
      <div
        className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl"
        style={{ backgroundColor: colors.border, opacity: 0.55 }}
      />
      <div
        className="tag px-4 py-4 absolute top-1/2 -translate-y-1/2"
        style={{ borderLeft: `3px solid ${colors.border}`, width: 130, left: 16 }}
      >
        <div className="font-display font-semibold text-xl text-bark">{grade}</div>
        <div className="latin text-[10px] mt-0.5">{levelLatin[grade]}</div>
        <div className="text-[10px] text-stem leading-tight mt-1">
          {levelVernacular[grade]}
        </div>
      </div>
    </div>
  )
}

const nodeTypes = { skillNode: SkillNode, laneLabel: LaneLabel }

function pickFocusSkill(skills, stateById) {
  const rank = { learning_easy: 2, learning_medium: 2, learning_hard: 2, needs_review: 1 }
  let best = null
  for (const s of skills) {
    const st = stateById.get(s.id)
    if (!st) continue
    const r = rank[st.status] ?? 0
    if (!r) continue
    if (!best || r > best.r || (r === best.r && st.mastery_level > best.m)) {
      best = { id: s.id, r, m: st.mastery_level }
    }
  }
  return best?.id ?? null
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < MOBILE_BREAKPOINT : false
  )
  useEffect(() => {
    if (typeof window === "undefined") return
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const handler = (e) => setIsMobile(e.matches)
    mql.addEventListener("change", handler)
    return () => mql.removeEventListener("change", handler)
  }, [])
  return isMobile
}

function SkillTreeInner({ skills, skillTreeData, isLoading }) {
  const navigate = useNavigate()
  const { fitView, setCenter, getZoom } = useReactFlow()
  const isMobile = useIsMobile()

  const children = useAuthStore((s) => s.children)
  const selectedChildId = useAuthStore((s) => s.selectedChildId)
  const currentChild = useMemo(
    () => children.find((c) => c.id === selectedChildId) ?? null,
    [children, selectedChildId]
  )

  const stateById = useMemo(() => {
    const map = new Map()
    for (const row of skillTreeData ?? []) map.set(row.skill_id, row)
    return map
  }, [skillTreeData])

  const focusId = useMemo(
    () => (skills ? pickFocusSkill(skills, stateById) : null),
    [skills, stateById]
  )

  const skillsById = useMemo(() => {
    const map = new Map()
    for (const s of skills ?? []) map.set(s.id, s)
    return map
  }, [skills])

  const { nodes: initialNodes, edges: initialEdges, bounds } = useMemo(
    () =>
      skills
        ? buildGraph(skills, focusId, stateById)
        : { nodes: [], edges: [], bounds: null },
    [skills, focusId, stateById]
  )

  const translateExtent = useMemo(() => {
    if (!bounds) return undefined
    const pad = 80
    return [
      [bounds.minX - pad, bounds.minY - pad],
      [bounds.maxX + pad, bounds.maxY + pad],
    ]
  }, [bounds])

  const flowRef = useRef(null)
  const minZoomRef = useRef(0.5)
  const [minZoom, setMinZoom] = useState(0.5)
  useEffect(() => {
    if (!bounds || !flowRef.current) return
    const update = () => {
      const w = flowRef.current?.clientWidth ?? 0
      const treeW = bounds.maxX - bounds.minX
      if (!w || !treeW) return
      const next = Math.max(0.4, Math.min(1.1, w / treeW))
      minZoomRef.current = next
      setMinZoom(next)
    }
    update()
    const obs = new ResizeObserver(update)
    obs.observe(flowRef.current)
    return () => obs.disconnect()
  }, [bounds])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  useEffect(() => {
    setNodes(initialNodes)
    setEdges(initialEdges)
  }, [initialNodes, initialEdges, setNodes, setEdges])

  const [selected, setSelected] = useState(null)
  const [query, setQuery] = useState("")
  const [searchOpen, setSearchOpen] = useState(false)
  const [gradeFilter, setGradeFilter] = useState(null)
  const [focusedNodeId, setFocusedNodeId] = useState(null)
  const hoverContext = useMemo(() => ({ hoveredId: null, prereqs: EMPTY_SET }), [])

  const centeredRef = useRef(false)
  const [rfReady, setRfReady] = useState(false)
  const onInit = useCallback(() => setRfReady(true), [])

  useEffect(() => {
    if (centeredRef.current || !rfReady || !initialNodes.length) return
    const skillNodes = initialNodes.filter((n) => n.type === "skillNode")
    if (!skillNodes.length) return
    const focus = skillNodes.find((n) => n.id === focusId)
    const gradeForLane = focus ? focus.data.grade : currentChild?.grade
    const bandNodes = gradeForLane
      ? skillNodes.filter((n) => n.data.grade === gradeForLane)
      : skillNodes
    if (!bandNodes.length) return

    centeredRef.current = true
    const ids = bandNodes.map((n) => ({ id: n.id }))
    if (gradeForLane) ids.push({ id: `lane-${gradeForLane}` })
    setTimeout(() => {
      fitView({
        nodes: ids,
        maxZoom: isMobile ? 0.9 : 1.3,
        minZoom: minZoomRef.current,
        padding: isMobile ? 0.08 : 0.02,
        duration: 600,
      })
    }, 50)
  }, [rfReady, initialNodes, focusId, currentChild, fitView, isMobile])

  const applyFilter = useCallback(
    (q, grade) => {
      const needle = q.trim().toLowerCase()
      const matchesQuery = (s) =>
        !needle ||
        s.label.toLowerCase().includes(needle) ||
        s.id.toLowerCase().includes(needle)

      setNodes((ns) =>
        ns.map((n) => {
          if (n.type === "laneLabel") {
            const dim = grade && n.data.grade !== grade
            return { ...n, style: { ...n.style, opacity: dim ? 0.3 : 1 } }
          }
          if (n.type !== "skillNode") return n
          const s = n.data
          let dim = false
          if (grade) dim = s.grade !== grade
          if (needle) dim = dim || !matchesQuery(s)
          return { ...n, style: { ...n.style, opacity: dim ? 0.2 : 1 } }
        })
      )
    },
    [setNodes]
  )

  const onNodeClick = useCallback((_, node) => {
    if (node.type !== "skillNode") return
    setSelected(node.data)
    setFocusedNodeId(node.id)
  }, [])

  const onPaneClick = useCallback(() => {
    setSelected(null)
  }, [])

  const onQueryChange = useCallback(
    (e) => {
      const v = e.target.value
      setQuery(v)
      applyFilter(v, gradeFilter)
    },
    [applyFilter, gradeFilter]
  )

  const selectGrade = useCallback(
    (g) => {
      const next = gradeFilter === g ? null : g
      setGradeFilter(next)
      applyFilter(query, next)
    },
    [applyFilter, gradeFilter, query]
  )

  const onGradeSelectChange = useCallback(
    (e) => {
      const v = e.target.value || null
      setGradeFilter(v)
      applyFilter(query, v)
    },
    [applyFilter, query]
  )

  const onOverview = useCallback(() => {
    fitView({ padding: 0.05, duration: 500 })
    setSelected(null)
  }, [fitView])

  const minimapColor = useCallback(
    (node) => node.data?.colors?.minimap ?? "#A1AEA3",
    []
  )

  const selectById = useCallback(
    (id) => {
      const n = nodes.find((x) => x.id === id && x.type === "skillNode")
      if (!n) return
      setSelected(n.data)
      setFocusedNodeId(id)
    },
    [nodes]
  )

  const visibleSkillNodes = useMemo(
    () => nodes.filter((n) => n.type === "skillNode" && (n.style?.opacity ?? 1) > 0.5),
    [nodes]
  )

  const onKeyDown = useCallback(
    (e) => {
      if (!visibleSkillNodes.length) return
      const target = e.target
      const tag = target?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return
      const k = e.key
      const isArrow = k === "ArrowUp" || k === "ArrowDown" || k === "ArrowLeft" || k === "ArrowRight"
      const isEnter = k === "Enter"
      if (!isArrow && !isEnter) return

      if (isEnter) {
        if (focusedNodeId) {
          e.preventDefault()
          selectById(focusedNodeId)
        }
        return
      }

      e.preventDefault()
      const cur = visibleSkillNodes.find((n) => n.id === focusedNodeId)
      if (!cur) {
        setFocusedNodeId(visibleSkillNodes[0].id)
        return
      }

      const dx = k === "ArrowLeft" ? -1 : k === "ArrowRight" ? 1 : 0
      const dy = k === "ArrowUp" ? -1 : k === "ArrowDown" ? 1 : 0
      const cx = cur.position.x
      const cy = cur.position.y

      let best = null
      let bestScore = Infinity
      for (const n of visibleSkillNodes) {
        if (n.id === cur.id) continue
        const ddx = n.position.x - cx
        const ddy = n.position.y - cy
        const primary = dx !== 0 ? ddx * dx : ddy * dy
        if (primary <= 0) continue
        const orthogonal = dx !== 0 ? Math.abs(ddy) : Math.abs(ddx)
        const score = primary + orthogonal * 2
        if (score < bestScore) {
          bestScore = score
          best = n
        }
      }
      if (best) {
        setFocusedNodeId(best.id)
        setCenter(best.position.x + 70, best.position.y + 85, {
          zoom: getZoom(),
          duration: 250,
        })
      }
    },
    [visibleSkillNodes, focusedNodeId, selectById, setCenter, getZoom]
  )

  const focusStyle = useMemo(() => {
    if (!focusedNodeId) return null
    const safe = focusedNodeId.replace(/["\\]/g, "\\$&")
    return `.react-flow__node[data-id="${safe}"] .specimen { outline: 2px solid #3F6F4A; outline-offset: 3px; border-radius: 18px; }`
  }, [focusedNodeId])

  if (isLoading) {
    return (
      <AppShell surface="plain">
        <div className="flex-1 flex items-center justify-center text-stem">
          <span className="latin">Germinatio…</span>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell surface="plain" className="overflow-hidden">
      <header className="border-b border-sage/10 bg-paper">
        <div className="flex items-center gap-2 px-3 sm:px-4 md:px-6 py-3 min-w-0">
          <a
            href="/"
            className="text-sage-deep hover:underline text-sm font-semibold shrink-0"
          >
            ← Serre
          </a>
          <div className="hidden lg:block shrink-0 ml-1">
            <LatinLabel>Hortus mathematicus</LatinLabel>
            <h1 className="font-display font-semibold text-lg text-bark leading-tight">
              Carte des espèces
            </h1>
          </div>
          <h1 className="lg:hidden font-display font-semibold text-base text-bark leading-tight truncate">
            Carte des espèces
          </h1>

          <div className="hidden sm:flex items-center gap-1 ml-2 overflow-x-auto min-w-0">
            {GRADES.map((g) => (
              <button
                key={g}
                onClick={() => selectGrade(g)}
                className={`navlink shrink-0 ${gradeFilter === g ? "active" : ""}`}
                aria-pressed={gradeFilter === g}
              >
                {g}
              </button>
            ))}
          </div>
          <select
            aria-label="Filtrer par année"
            className="sm:hidden ml-auto rounded-full border border-sage/25 bg-paper text-bark text-sm px-3 py-1.5 max-w-[9rem]"
            value={gradeFilter ?? ""}
            onChange={onGradeSelectChange}
          >
            <option value="">Toutes les années</option>
            {GRADES.map((g) => (
              <option key={g} value={g}>
                {g} · {levelDescriptions[g]}
              </option>
            ))}
          </select>

          <div className="hidden sm:flex items-center gap-2 ml-auto shrink-0">
            <button
              onClick={onOverview}
              className="pill pill-ghost !py-2 !px-3 !text-xs"
              aria-label="Vue d'ensemble"
            >
              Vue d'ensemble
            </button>
            <div className="hidden md:block">
              <Input
                type="search"
                value={query}
                onChange={onQueryChange}
                placeholder="Rechercher une plante…"
                className="w-full sm:w-64 max-w-full"
              />
            </div>
            <button
              onClick={() => setSearchOpen((v) => !v)}
              className="md:hidden navlink !p-2"
              aria-label="Rechercher"
              aria-expanded={searchOpen}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
              </svg>
            </button>
          </div>

          <button
            onClick={() => setSearchOpen((v) => !v)}
            className="sm:hidden navlink !p-2 shrink-0"
            aria-label="Rechercher"
            aria-expanded={searchOpen}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
            </svg>
          </button>
        </div>

        {searchOpen && (
          <div className="md:hidden px-3 sm:px-4 py-2 border-t border-sage/10">
            <Input
              type="search"
              value={query}
              onChange={onQueryChange}
              placeholder="Rechercher une plante…"
              autoFocus
              className="w-full max-w-full"
            />
          </div>
        )}
      </header>

      <div
        ref={flowRef}
        className="flex-1 relative outline-none sentier-canvas touch-none"
        tabIndex={0}
        onKeyDown={onKeyDown}
        role="application"
        aria-label="Carte interactive des compétences"
      >
        {focusStyle && <style>{focusStyle}</style>}
        <div className="absolute inset-0">
          <SkillTreeHoverContext.Provider value={hoverContext}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              onInit={onInit}
              nodeTypes={nodeTypes}
              minZoom={minZoom}
              maxZoom={1.5}
              translateExtent={translateExtent}
              panOnScroll={!isMobile}
              panOnScrollSpeed={0.5}
              zoomOnScroll={false}
              zoomOnPinch
              panOnDrag
              proOptions={{ hideAttribution: true }}
            >
              <Background color="rgba(63, 111, 74, 0.12)" gap={28} size={1} />
              <Controls
                position={isMobile ? "bottom-left" : "bottom-right"}
                showInteractive={false}
              />
              <div className="hidden md:block">
                <MiniMap
                  nodeColor={minimapColor}
                  maskColor="rgba(246, 248, 243, 0.7)"
                  position="bottom-left"
                  pannable
                  zoomable
                />
              </div>
            </ReactFlow>
          </SkillTreeHoverContext.Provider>
        </div>

        <StatusLegend />
      </div>

      {selected && (
        <DetailPanel
          skill={selected}
          state={stateById.get(selected.id)}
          skillsById={skillsById}
          masteryById={stateById}
          onClose={() => setSelected(null)}
          onPractice={(id) => navigate(`/exercise?skill=${encodeURIComponent(id)}`)}
        />
      )}
    </AppShell>
  )
}

export default function SkillTreeScreen() {
  const selectedChildId = useAuthStore((s) => s.selectedChildId)

  const { data: skills } = useQuery({
    queryKey: ["skills"],
    queryFn: async () => {
      const data = await api.get("/skills/")
      return data.map((s) => ({ ...s, prerequisites: s.prerequisite_ids }))
    }
  })

  const { data: skillTreeData, isLoading: treeLoading } = useSkillTree(selectedChildId)

  const isLoading = !skills || (selectedChildId && treeLoading)

  return (
    <ReactFlowProvider>
      <SkillTreeInner
        skills={skills}
        skillTreeData={skillTreeData}
        isLoading={isLoading}
      />
    </ReactFlowProvider>
  )
}

function StatusLegend() {
  const items = [
    { status: "locked", mastery: 0, label: "À découvrir" },
    { status: "in_progress", mastery: 0.1, label: "Découverte" },
    { status: "in_progress", mastery: 0.55, label: "En cours" },
    { status: "done", mastery: 1, label: "Acquis" },
    { status: "wilted", mastery: 0, label: "À revoir" },
  ]
  return (
    <Card
      className="hidden md:flex absolute top-4 left-4 z-10 flex-col gap-1 px-3 py-2"
      aria-label="Légende"
    >
      {items.map(({ status, mastery, label }) => (
        <div key={label} className="flex items-center gap-2 text-[11px] text-bark">
          <span className="w-6 h-6 flex items-center justify-center shrink-0">
            <Plant status={status} mastery={mastery} size={22} />
          </span>
          {label}
        </div>
      ))}
    </Card>
  )
}

const SKILL_XP_MAX = 30

const STATUS_LABEL = {
  mastered: "Acquis",
  learning_hard: "Presque acquis",
  learning_medium: "En cours",
  learning_easy: "Découverte",
  needs_review: "À revoir",
  not_started: "À découvrir",
}

const STATUS_DOT = {
  mastered: "#6FA274",
  learning_hard: "#B88A3C",
  learning_medium: "#C9A560",
  learning_easy: "#E8D28A",
  needs_review: "#E8A6A1",
  not_started: "#F8EDC9",
}

const LEARNING_STATUSES = new Set(["learning_easy", "learning_medium", "learning_hard"])

function sentierStatusFor(skill, state) {
  if (state?.status === "mastered") return "done"
  if (state?.status === "needs_review") return "wilted"
  if (state && LEARNING_STATUSES.has(state.status)) return "in_progress"
  if (skill.unlocked) return "unlocked"
  return "locked"
}

function DetailPanel({ skill, state, skillsById, masteryById, onClose, onPractice }) {
  const xp = state?.skill_xp ?? 0
  const pct = Math.round((xp / SKILL_XP_MAX) * 100)
  const attempts = state?.total_attempts ?? 0
  const backendStatus = state?.status ?? "not_started"
  const sentierStatus = sentierStatusFor(skill, state)

  const prereqs = useMemo(
    () =>
      (skill.prerequisites ?? [])
        .map((pid) => ({
          id: pid,
          skill: skillsById?.get(pid),
          state: masteryById?.get(pid),
        }))
        .filter((p) => p.skill),
    [skill, skillsById, masteryById]
  )
  const children = useMemo(() => {
    if (!skillsById) return []
    return [...skillsById.values()].filter((s) =>
      (s.prerequisites ?? s.prerequisite_ids ?? []).includes(skill.id)
    )
  }, [skill.id, skillsById])

  const canPractice = skill.unlocked && sentierStatus !== "done"
  const actionLabel =
    sentierStatus === "wilted"
      ? "Arroser cette plante"
      : sentierStatus === "done"
        ? "Revoir cette plante"
        : "Commencer"

  return (
    <aside
      data-testid="skill-detail-panel"
      role="dialog"
      aria-label={skill.label}
      className="absolute z-50 bg-bone border border-sage/15 flex flex-col gap-4 overflow-y-auto
                 inset-x-3 bottom-3 top-auto max-h-[72vh] rounded-2xl p-4 shadow-[0_30px_60px_-30px_rgba(43,58,46,0.35)]
                 md:inset-auto md:top-4 md:bottom-4 md:right-4 md:w-[360px] md:max-h-[calc(100%-2rem)] md:rounded-xl md:p-5"
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="latin text-[11px]">
            {levelDescriptions[skill.grade]} · {skill.grade}
          </div>
          <h2 className="font-display font-semibold text-lg md:text-xl text-bark leading-tight mt-0.5">
            {skill.label}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 shrink-0 rounded-full border border-sage/20 bg-paper text-stem hover:bg-mist hover:text-bark text-xl leading-none cursor-pointer"
          aria-label="Fermer"
        >
          ×
        </button>
      </header>

      <div
        className="rounded-2xl flex flex-col items-center gap-3 py-4"
        style={{
          background: "linear-gradient(180deg, var(--color-mist) 0%, var(--color-sage-pale) 100%)",
        }}
      >
        <Plant status={sentierStatus} mastery={state?.mastery_level ?? 0} size={64} />
        <span className="inline-flex items-center gap-2 bg-bone px-3 py-1 rounded-full text-xs font-semibold text-bark border border-sage/15">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: STATUS_DOT[backendStatus] }}
          />
          {STATUS_LABEL[backendStatus]}
        </span>
      </div>

      <div className="rounded-xl bg-paper border border-sage/10 px-4 py-3 flex flex-col gap-2.5">
        <div className="flex items-baseline justify-between text-xs text-stem">
          <span>XP de la plante</span>
          <span className="font-mono font-bold text-bark tabular-nums">
            {Math.round(xp)} / {SKILL_XP_MAX}
          </span>
        </div>
        <div className="relative h-2 rounded-full bg-mist overflow-visible">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: "linear-gradient(to right, var(--color-honey), var(--color-sage))",
            }}
          />
          <div
            className="absolute -top-0.5 -bottom-0.5 w-px bg-stem opacity-40"
            style={{ left: `${(10 / SKILL_XP_MAX) * 100}%` }}
            title="10 XP — pousse"
          />
          <div
            className="absolute -top-0.5 -bottom-0.5 w-px bg-stem opacity-40"
            style={{ left: `${(20 / SKILL_XP_MAX) * 100}%` }}
            title="20 XP — bouton"
          />
          <div
            className="absolute -top-0.5 -bottom-0.5 w-0.5 bg-sage-deep opacity-60"
            style={{ left: "100%", transform: "translateX(-2px)" }}
            title="30 XP — floraison"
          />
        </div>
        <div className="flex items-baseline justify-between text-[11px] text-stem">
          <span>Questions vues</span>
          <span className="font-mono text-bark tabular-nums">{attempts}</span>
        </div>
      </div>

      {prereqs.length > 0 && (
        <section className="flex flex-col gap-1.5">
          <h3 className="text-[10px] uppercase tracking-wider font-bold text-stem">
            Prérequis
          </h3>
          <ul className="flex flex-col gap-1">
            {prereqs.map((p) => {
              const st = p.state?.status ?? "not_started"
              const ppct = Math.round((p.state?.mastery_level ?? 0) * 100)
              return (
                <li
                  key={p.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs border border-sage/5 ${st === "mastered" ? "bg-sage-pale/40" : st === "needs_review" ? "bg-rose-soft/60" : "bg-paper"}`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: STATUS_DOT[st] }}
                  />
                  <span className="flex-1 text-bark truncate">{p.skill.label}</span>
                  <span className="font-mono text-[10px] font-bold text-stem tabular-nums">
                    {ppct}%
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {children.length > 0 && (
        <section className="flex flex-col gap-1.5">
          <h3 className="text-[10px] uppercase tracking-wider font-bold text-stem">
            Ce que ça débloquera
          </h3>
          <ul className="flex flex-col gap-1">
            {children.slice(0, 6).map((c) => (
              <li
                key={c.id}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs bg-paper border border-sage/5"
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: STATUS_DOT.not_started }}
                />
                <span className="flex-1 text-bark truncate">{c.label}</span>
                <span className="font-mono text-[10px] font-bold text-stem">{c.grade}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-xs text-stem leading-relaxed">{skill.description}</p>

      <div className="flex flex-col gap-2 mt-auto">
        {canPractice && onPractice && (
          <Button
            data-testid="practice-skill"
            onClick={() => onPractice(skill.id)}
            className="w-full"
          >
            {actionLabel}
          </Button>
        )}
        {sentierStatus === "done" && onPractice && (
          <button
            type="button"
            onClick={() => onPractice(skill.id)}
            className="w-full py-3 rounded-xl font-semibold text-sm bg-mist text-bark border border-sage/15 hover:bg-sage-pale/50 cursor-pointer"
          >
            Revoir cette plante
          </button>
        )}
        {!skill.unlocked && (
          <div className="rounded-xl bg-mist/60 border border-sage/15 px-3 py-2.5">
            <div className="text-xs font-semibold text-bark mb-1">
              Pas encore accessible
            </div>
            <p className="text-[11px] text-stem leading-relaxed">
              Maîtrise d'abord les racines marquées ci-dessus.
            </p>
          </div>
        )}
      </div>
    </aside>
  )
}
