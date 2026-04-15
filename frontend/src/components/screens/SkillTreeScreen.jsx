import { useState, useCallback, useEffect, useMemo } from "react"
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  useNodesState,
  useEdgesState,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { useNavigate } from "react-router"
import { api } from "../../api/client"
import SkillNode from "../ui/SkillNode"
import { levelDescriptions } from "../../lib/constants"
import {
  GRADES,
  GRADE_COLORS,
  buildGraph,
  collectRelated,
} from "../../lib/skillTreeLayout"

function LaneLabel({ data }) {
  const { grade, colors, width, height } = data
  return (
    <div className="pointer-events-none flex items-center" style={{ width, height }}>
      <div
        className="flex flex-col items-center justify-center rounded-2xl px-3 py-4 shrink-0"
        style={{
          background: `linear-gradient(135deg, ${colors.bg}, ${colors.bg}aa)`,
          border: `1.5px solid ${colors.border}`,
          width: 130,
        }}
      >
        <span className="text-lg font-bold font-headline" style={{ color: colors.text }}>
          {grade}
        </span>
        <span className="text-[10px] text-center leading-tight mt-0.5" style={{ color: colors.text }}>
          {levelDescriptions[grade]}
        </span>
      </div>
      <div
        className="flex-1 h-[85%] ml-6 rounded-xl"
        style={{ backgroundColor: colors.bg, opacity: 0.15 }}
      />
    </div>
  )
}

const nodeTypes = { skillNode: SkillNode, laneLabel: LaneLabel }

export default function SkillTreeScreen() {
  const navigate = useNavigate()
  const [skills, setSkills] = useState(null)

  useEffect(() => {
    api.get("/skills/").then((data) =>
      setSkills(data.map((s) => ({ ...s, prerequisites: s.prerequisite_ids })))
    )
  }, [])

  const nextId = useMemo(
    () => skills?.find((s) => s.grade === "P2")?.id ?? null,
    [skills]
  )

  const { nodes: initialNodes, edges: initialEdges, successors } = useMemo(
    () =>
      skills
        ? buildGraph(skills, nextId)
        : { nodes: [], edges: [], successors: new Map() },
    [skills, nextId]
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  useEffect(() => {
    setNodes(initialNodes)
    setEdges(initialEdges)
  }, [initialNodes, initialEdges, setNodes, setEdges])
  const [selected, setSelected] = useState(null)
  const [query, setQuery] = useState("")
  const [gradeFilter, setGradeFilter] = useState(null)

  const applyHighlight = useCallback(
    (focusId, q, grade) => {
      const related = focusId ? collectRelated(focusId, skills, successors) : null
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
          if (related) {
            dim = s.id !== focusId && !related.ancestors.has(s.id)
          }
          if (grade) dim = dim || s.grade !== grade
          if (needle) dim = dim || !matchesQuery(s)
          return { ...n, style: { ...n.style, opacity: dim ? 0.2 : 1 } }
        })
      )
      setEdges((es) =>
        es.map((e) => {
          let active = true
          if (related) {
            active =
              (related.ancestors.has(e.source) || e.source === focusId) &&
              (related.ancestors.has(e.target) || e.target === focusId)
          }
          const color = active && related ? "#0059b6" : "#c2c7dd"
          return {
            ...e,
            style: {
              ...e.style,
              stroke: color,
              strokeWidth: active && related ? 2.5 : 1.5,
              strokeDasharray: active && related ? "0" : "6 6",
              opacity: active ? 1 : 0.1,
            },
            markerEnd: { type: MarkerType.ArrowClosed, color, width: 14, height: 14 },
          }
        })
      )
    },
    [skills, successors, setNodes, setEdges]
  )

  const onNodeClick = useCallback(
    (_, node) => {
      if (node.type !== "skillNode") return
      setSelected(node.data)
      applyHighlight(node.id, query, gradeFilter)
    },
    [applyHighlight, query, gradeFilter]
  )

  const onPaneClick = useCallback(() => {
    setSelected(null)
    applyHighlight(null, query, gradeFilter)
  }, [applyHighlight, query, gradeFilter])

  const onQueryChange = useCallback(
    (e) => {
      const v = e.target.value
      setQuery(v)
      applyHighlight(selected?.id ?? null, v, gradeFilter)
    },
    [applyHighlight, selected, gradeFilter]
  )

  const selectGrade = useCallback(
    (g) => {
      const next = gradeFilter === g ? null : g
      setGradeFilter(next)
      applyHighlight(selected?.id ?? null, query, next)
    },
    [applyHighlight, gradeFilter, query, selected]
  )

  const minimapColor = useCallback(
    (node) => node.data?.colors?.minimap ?? "#c2c7dd",
    []
  )

  if (!skills) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background text-on-surface-variant">
        Chargement…
      </div>
    )
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-background">
      <header className="flex items-center gap-6 px-8 py-4 border-b border-outline-variant/30">
        <a href="/" className="text-primary hover:text-primary-dim text-sm font-medium">
          ← Accueil
        </a>
        <div>
          <h1 className="font-headline text-xl font-bold text-on-background leading-tight">
            Carte des Compétences
          </h1>
          <p className="text-xs text-on-surface-variant">
            Explorez le parcours mathématique et visualisez vos forces
          </p>
        </div>
        <div className="flex items-center gap-1 ml-4">
          {GRADES.map((g) => {
            const active = gradeFilter === g
            const colors = GRADE_COLORS[g]
            return (
              <button
                key={g}
                onClick={() => selectGrade(g)}
                className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
                style={{
                  background: active ? colors.border : "transparent",
                  color: active ? "#fff" : colors.text,
                  border: `1.5px solid ${active ? colors.border : colors.bg}`,
                }}
              >
                {g}
              </button>
            )
          })}
        </div>
        <input
          type="search"
          value={query}
          onChange={onQueryChange}
          placeholder="Rechercher une compétence…"
          className="ml-auto px-3 py-1.5 text-sm rounded-full border border-outline-variant/50 bg-surface-container focus:outline-none focus:border-primary w-64"
        />
      </header>

      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.15}
          maxZoom={2}
          panOnScroll
          zoomOnScroll={false}
          zoomOnPinch
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#d4d8ea" gap={28} size={1} />
          <Controls position="bottom-right" showInteractive={false} />
          <MiniMap
            nodeColor={minimapColor}
            maskColor="rgba(244, 242, 255, 0.7)"
            position="bottom-left"
            pannable
            zoomable
          />
        </ReactFlow>

        {selected && <DetailPanel skill={selected} onClose={onPaneClick} onPractice={(id) => navigate(`/exercise?skill=${encodeURIComponent(id)}`)} />}
        <StatusLegend />
      </div>
    </div>
  )
}

function StatusLegend() {
  const items = [
    { label: "Complétée", color: "#00694b", ring: "solid" },
    { label: "En cours", color: "#8a6d00", ring: "dashed" },
    { label: "Verrouillée", color: "#b0b5c9", ring: "solid" },
  ]
  return (
    <div className="absolute bottom-4 right-20 flex flex-col gap-1.5 bg-surface-container/90 backdrop-blur px-3 py-2 rounded-xl shadow-ambient-sm">
      {items.map(({ label, color, ring }) => (
        <div key={label} className="flex items-center gap-2 text-xs text-on-surface-variant">
          <span className="w-3 h-3 rounded-full" style={{ border: `2px ${ring} ${color}` }} />
          {label}
        </div>
      ))}
    </div>
  )
}

function DetailPanel({ skill, onClose, onPractice }) {
  const colors = GRADE_COLORS[skill.grade]
  return (
    <div className="absolute top-4 right-4 w-80 glass-card ghost-border shadow-ambient rounded-2xl p-5 z-50">
      <div className="flex items-start justify-between mb-3">
        <span
          className="text-xs font-medium px-2.5 py-0.5 rounded-full"
          style={{ backgroundColor: colors.bg, color: colors.text }}
        >
          {skill.grade} — {levelDescriptions[skill.grade]}
        </span>
        <button
          onClick={onClose}
          className="text-on-surface-variant hover:text-on-surface text-lg leading-none"
        >
          ×
        </button>
      </div>
      <h3 className="font-headline font-bold text-on-background text-sm mb-1">
        {skill.label}
      </h3>
      <p className="text-xs text-on-surface-variant leading-relaxed mb-3">
        {skill.description}
      </p>
      <div className="flex items-center gap-4 text-xs text-on-surface-variant">
        <span>Seuil : {skill.mastery_threshold} réponses</span>
        <span>Prérequis : {skill.prerequisites.length}</span>
      </div>
      {skill.prerequisites.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {skill.prerequisites.map((id) => (
            <code
              key={id}
              className="text-[10px] bg-surface-container px-1.5 py-0.5 rounded text-on-surface-variant"
            >
              {id}
            </code>
          ))}
        </div>
      )}
      {onPractice && (
        <button
          data-testid="practice-skill"
          onClick={() => onPractice(skill.id)}
          className="mt-4 w-full gradient-soul text-on-primary font-headline font-bold py-2.5 rounded-xl spring-hover cursor-pointer text-sm"
        >
          Pratiquer cette compétence
        </button>
      )}
    </div>
  )
}
