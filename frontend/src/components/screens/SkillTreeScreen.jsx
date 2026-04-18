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
import Button from "../ui/Button"
import Card from "../ui/Card"
import Input from "../ui/Input"
import { LatinLabel } from "../ui/Heading"
import { levelDescriptions, levelLatin, levelVernacular } from "../../lib/constants"
import { GRADES, buildGraph } from "../../lib/skillTreeLayout"
import { SkillTreeHoverContext } from "../../lib/skillTreeHoverContext"

const EMPTY_SET = new Set()

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
  const rank = { in_progress: 2, needs_review: 1 }
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

function SkillTreeInner({ skills, skillTreeData, isLoading }) {
  const navigate = useNavigate()
  const { fitView } = useReactFlow()

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
        maxZoom: 1.3,
        minZoom: minZoomRef.current,
        padding: 0.02,
        duration: 600
      })
    }, 50)
  }, [rfReady, initialNodes, focusId, currentChild, fitView])

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

  const onOverview = useCallback(() => {
    fitView({ padding: 0.05, duration: 500 })
    setSelected(null)
  }, [fitView])

  const minimapColor = useCallback(
    (node) => node.data?.colors?.minimap ?? "#A1AEA3",
    []
  )

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
      <header className="flex items-center gap-3 px-4 md:px-6 py-3 border-b border-sage/10 bg-paper">
        <a href="/" className="text-sage-deep hover:underline text-sm font-semibold shrink-0">
          ← Serre
        </a>
        <div className="hidden md:block shrink-0">
          <LatinLabel>Hortus mathematicus</LatinLabel>
          <h1 className="font-display font-semibold text-lg text-bark leading-tight">
            Carte des espèces
          </h1>
        </div>
        <div className="flex items-center gap-1 ml-2 overflow-x-auto">
          {GRADES.map((g) => (
            <button
              key={g}
              onClick={() => selectGrade(g)}
              className={`navlink shrink-0 ${gradeFilter === g ? "active" : ""}`}
            >
              {g}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
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
              className="!w-64"
            />
          </div>
          <button
            onClick={() => setSearchOpen((v) => !v)}
            className="md:hidden navlink !p-2"
            aria-label="Rechercher"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
            </svg>
          </button>
        </div>
      </header>

      {searchOpen && (
        <div className="md:hidden px-4 py-2 border-b border-sage/10 bg-paper">
          <Input
            type="search"
            value={query}
            onChange={onQueryChange}
            placeholder="Rechercher une plante…"
            autoFocus
          />
        </div>
      )}

      <div ref={flowRef} className="flex-1 relative">
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
          panOnScroll
          zoomOnScroll={false}
          zoomOnPinch
          panOnDrag
          proOptions={{ hideAttribution: true }}
        >
          <Background color="rgba(63, 111, 74, 0.18)" gap={22} size={1} />
          <Controls position="bottom-right" showInteractive={false} />
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

        {selected && (
          <DetailPanel
            skill={selected}
            state={stateById.get(selected.id)}
            onClose={onPaneClick}
            onPractice={(id) =>
              navigate(`/exercise?skill=${encodeURIComponent(id)}`)
            }
          />
        )}
        <StatusLegend />
      </div>
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
    { label: "Floraison", color: "#E8C66A" },
    { label: "En croissance", color: "#6FA274" },
    { label: "À arroser", color: "#4F8BAC" },
    { label: "En sommeil", color: "#A1AEA3" },
  ]
  return (
    <Card className="hidden md:flex absolute bottom-4 right-20 flex-col gap-1.5 px-3 py-2.5">
      {items.map(({ label, color }) => (
        <div key={label} className="flex items-center gap-2 text-[11px] text-bark">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
          {label}
        </div>
      ))}
    </Card>
  )
}

function DetailPanel({ skill, state, onClose, onPractice }) {
  const pct = state ? Math.round(state.mastery_level * 100) : 0
  const attempts = state?.total_attempts ?? 0
  return (
    <Card
      variant="tag"
      className="absolute top-4 left-4 right-4 md:left-auto md:right-4 md:w-80 p-5 z-50 bg-paper"
    >
      <div className="flex items-start justify-between mb-3">
        <span className="chip chip-sky">
          {skill.grade} · {levelDescriptions[skill.grade]}
        </span>
        <button
          onClick={onClose}
          className="text-stem hover:text-bark text-xl leading-none cursor-pointer"
          aria-label="Fermer"
        >
          ×
        </button>
      </div>
      <LatinLabel>{skill.family}</LatinLabel>
      <h3 className="font-display font-semibold text-bark text-base mt-0.5 leading-tight">
        {skill.label}
      </h3>
      {attempts > 0 && (
        <div className="mt-3">
          <div className="flex items-baseline justify-between">
            <span className="latin text-[11px]">Maîtrise</span>
            <span className="font-mono text-sm font-semibold text-sage-deep">{pct}%</span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-mist overflow-hidden">
            <div className="h-full bg-sage transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <div className="text-[11px] text-stem mt-1">
            {attempts} question{attempts > 1 ? "s" : ""} vues
          </div>
        </div>
      )}
      <p className="text-xs text-stem leading-relaxed mt-3">{skill.description}</p>
      <div className="flex items-center gap-4 text-xs text-stem mt-3">
        <span>Seuil · {skill.mastery_threshold}</span>
        <span>Racines · {skill.prerequisites.length}</span>
      </div>
      {onPractice && skill.unlocked && (
        <Button
          data-testid="practice-skill"
          onClick={() => onPractice(skill.id)}
          size="sm"
          className="mt-4 w-full"
        >
          Arroser cette plante
        </Button>
      )}
      {onPractice && !skill.unlocked && (
        <p className="mt-3 text-xs text-stem italic">
          Maîtrise d'abord les racines de cette plante.
        </p>
      )}
    </Card>
  )
}
