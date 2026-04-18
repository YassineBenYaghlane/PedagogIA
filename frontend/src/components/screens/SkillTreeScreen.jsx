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
import SkillListView from "../ui/SkillListView"
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
    if (isMobile || centeredRef.current || !rfReady || !initialNodes.length) return
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

  const onListSelect = useCallback((data) => {
    setSelected(data)
    setFocusedNodeId(data.id)
  }, [])

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

      {isMobile ? (
        <SkillListView
          nodes={nodes}
          gradeFilter={gradeFilter}
          onSelect={onListSelect}
          selectedId={selected?.id}
          focusedId={focusedNodeId}
        />
      ) : (
        <div
          ref={flowRef}
          className="flex-1 relative outline-none"
          tabIndex={0}
          onKeyDown={onKeyDown}
          role="application"
          aria-label="Carte interactive des compétences"
        >
          {focusStyle && <style>{focusStyle}</style>}
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

          <StatusLegend />
        </div>
      )}

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
    { label: "Floraison", color: "#E8C66A" },
    { label: "En croissance", color: "#6FA274" },
    { label: "À arroser", color: "#4F8BAC" },
    { label: "En sommeil", color: "#A1AEA3" },
  ]
  return (
    <Card
      className="hidden md:flex absolute top-4 left-4 z-10 flex-col gap-1.5 px-3 py-2.5"
      aria-label="Légende"
    >
      {items.map(({ label, color }) => (
        <div key={label} className="flex items-center gap-2 text-[11px] text-bark">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
          {label}
        </div>
      ))}
    </Card>
  )
}

function DetailPanel({ skill, state, skillsById, masteryById, onClose, onPractice }) {
  const pct = state ? Math.round(state.mastery_level * 100) : 0
  const attempts = state?.total_attempts ?? 0
  const missingPrereqs = useMemo(() => {
    if (skill.unlocked) return []
    return (skill.prerequisites ?? [])
      .map((pid) => ({
        id: pid,
        skill: skillsById?.get(pid),
        mastered: masteryById?.get(pid)?.status === "mastered",
      }))
      .filter((p) => !p.mastered && p.skill)
  }, [skill, skillsById, masteryById])

  return (
    <Card
      variant="tag"
      data-testid="skill-detail-panel"
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
      {!skill.unlocked && (
        <div className="mt-4 rounded-xl bg-mist/60 border border-sage/15 px-3 py-2.5">
          <div className="text-xs font-semibold text-bark mb-1">
            Pas encore accessible
          </div>
          {missingPrereqs.length > 0 ? (
            <>
              <p className="text-[11px] text-stem leading-relaxed">
                Maîtrise d'abord {missingPrereqs.length > 1 ? "ces racines" : "cette racine"} :
              </p>
              <ul className="mt-1.5 space-y-0.5">
                {missingPrereqs.map((p) => (
                  <li key={p.id} className="text-[11px] text-bark">
                    · {p.skill.label}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-[11px] text-stem italic">
              Maîtrise d'abord les racines de cette plante.
            </p>
          )}
        </div>
      )}
    </Card>
  )
}
