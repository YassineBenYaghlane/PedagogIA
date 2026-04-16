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
import Button from "../ui/Button"
import Card from "../ui/Card"
import Input from "../ui/Input"
import { LatinLabel } from "../ui/Heading"
import { levelDescriptions, levelLatin, levelVernacular } from "../../lib/constants"
import { GRADES, GRADE_COLORS, buildGraph, collectRelated } from "../../lib/skillTreeLayout"

function LaneLabel({ data }) {
  const { grade, colors, width, height } = data
  return (
    <div className="pointer-events-none flex items-center" style={{ width, height }}>
      <div
        className="tag px-4 py-4 shrink-0"
        style={{ borderLeft: `3px solid ${colors.border}`, width: 130 }}
      >
        <div className="font-display font-semibold text-xl text-bark">{grade}</div>
        <div className="latin text-[10px] mt-0.5">{levelLatin[grade]}</div>
        <div className="text-[10px] text-stem leading-tight mt-1">
          {levelVernacular[grade]}
        </div>
      </div>
      <div
        className="flex-1 h-[80%] ml-6 rounded-xl"
        style={{ backgroundColor: colors.bg, opacity: 0.2 }}
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
          if (related) dim = s.id !== focusId && !related.ancestors.has(s.id)
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
          const color = active && related ? "#3F6F4A" : "#A1AEA3"
          return {
            ...e,
            style: {
              ...e.style,
              stroke: color,
              strokeWidth: active && related ? 2 : 1.5,
              strokeDasharray: active && related ? "0" : "4 5",
              opacity: active ? 1 : 0.2,
            },
            markerEnd: { type: MarkerType.ArrowClosed, color, width: 12, height: 12 },
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
    (node) => node.data?.colors?.minimap ?? "#A1AEA3",
    []
  )

  if (!skills) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-chalk text-stem">
        <span className="latin">Germinatio…</span>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-chalk">
      <header className="flex items-center gap-4 px-6 py-3 border-b border-sage/10 bg-paper">
        <a href="/" className="text-sage-deep hover:underline text-sm font-semibold">
          ← Serre
        </a>
        <div className="hidden md:block">
          <LatinLabel>Hortus mathematicus</LatinLabel>
          <h1 className="font-display font-semibold text-lg text-bark leading-tight">
            Carte des compétences
          </h1>
        </div>
        <div className="flex items-center gap-1 ml-4">
          {GRADES.map((g) => (
            <button
              key={g}
              onClick={() => selectGrade(g)}
              className={`navlink ${gradeFilter === g ? "active" : ""}`}
            >
              {g}
            </button>
          ))}
        </div>
        <Input
          type="search"
          value={query}
          onChange={onQueryChange}
          placeholder="Rechercher une plante…"
          className="ml-auto !w-64"
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
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.15}
          maxZoom={2}
          panOnScroll
          zoomOnScroll={false}
          zoomOnPinch
          proOptions={{ hideAttribution: true }}
        >
          <Background color="rgba(63, 111, 74, 0.18)" gap={22} size={1} />
          <Controls position="bottom-right" showInteractive={false} />
          <MiniMap
            nodeColor={minimapColor}
            maskColor="rgba(246, 248, 243, 0.7)"
            position="bottom-left"
            pannable
            zoomable
          />
        </ReactFlow>

        {selected && (
          <DetailPanel
            skill={selected}
            onClose={onPaneClick}
            onPractice={(id) =>
              navigate(`/exercise?skill=${encodeURIComponent(id)}`)
            }
          />
        )}
        <StatusLegend />
      </div>
    </div>
  )
}

function StatusLegend() {
  const items = [
    { label: "Floraison", color: "#E8C66A" },
    { label: "En croissance", color: "#3F6F4A" },
    { label: "À arroser", color: "#4F8BAC" },
    { label: "En sommeil", color: "#A1AEA3" },
  ]
  return (
    <Card className="absolute bottom-4 right-20 flex flex-col gap-1.5 px-3 py-2.5">
      {items.map(({ label, color }) => (
        <div key={label} className="flex items-center gap-2 text-[11px] text-bark">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
          {label}
        </div>
      ))}
    </Card>
  )
}

function DetailPanel({ skill, onClose, onPractice }) {
  return (
    <Card
      variant="tag"
      className="absolute top-4 right-4 w-80 p-5 z-50 bg-paper"
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
      <p className="text-xs text-stem leading-relaxed mt-2">{skill.description}</p>
      <div className="flex items-center gap-4 text-xs text-stem mt-3">
        <span>Seuil · {skill.mastery_threshold}</span>
        <span>Racines · {skill.prerequisites.length}</span>
      </div>
      {skill.prerequisites.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {skill.prerequisites.map((id) => (
            <code
              key={id}
              className="text-[10px] bg-mist px-1.5 py-0.5 rounded text-stem font-mono"
            >
              {id}
            </code>
          ))}
        </div>
      )}
      {onPractice && (
        <Button
          data-testid="practice-skill"
          onClick={() => onPractice(skill.id)}
          size="sm"
          className="mt-4 w-full"
        >
          Arroser cette plante
        </Button>
      )}
    </Card>
  )
}
