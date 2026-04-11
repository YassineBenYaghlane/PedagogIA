import { useState, useCallback, useMemo } from "react"
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from "@xyflow/react"
import dagre from "dagre"
import yaml from "js-yaml"
import skillsRaw from "../../../backend/app/skill_tree/skills.yaml?raw"
import "@xyflow/react/dist/style.css"
import SkillNode from "../ui/SkillNode"
import { levelDescriptions } from "../../lib/constants"

const GRADE_COLORS = {
  P1: { bg: "#8cfece", border: "#00694b", text: "#004d36", minimap: "#00694b" },
  P2: { bg: "#fecb00", border: "#705900", text: "#413200", minimap: "#705900" },
  P3: { bg: "#68a0ff", border: "#0059b6", text: "#00224d", minimap: "#0059b6" },
  P4: { bg: "#f0c8ff", border: "#7b3d96", text: "#4a1264", minimap: "#7b3d96" },
  P5: { bg: "#ffb68a", border: "#b64600", text: "#5c2200", minimap: "#b64600" },
  P6: { bg: "#d4dbff", border: "#505a81", text: "#222d51", minimap: "#505a81" },
}

const NODE_WIDTH = 220
const NODE_HEIGHT = 60

function buildGraph(skills) {
  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: "TB", nodesep: 40, ranksep: 80, marginx: 40, marginy: 40 })
  g.setDefaultEdgeLabel(() => ({}))

  for (const skill of skills) {
    g.setNode(skill.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  }

  const edges = []
  for (const skill of skills) {
    for (const prereqId of skill.prerequisites) {
      g.setEdge(prereqId, skill.id)
      edges.push({
        id: `${prereqId}->${skill.id}`,
        source: prereqId,
        target: skill.id,
        type: "smoothstep",
        animated: false,
        style: { stroke: "#a1abd7", strokeWidth: 1.5 },
      })
    }
  }

  dagre.layout(g)

  const nodes = skills.map((skill) => {
    const pos = g.node(skill.id)
    const colors = GRADE_COLORS[skill.grade]
    return {
      id: skill.id,
      type: "skillNode",
      position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
      data: { ...skill, colors },
    }
  })

  return { nodes, edges }
}

const nodeTypes = { skillNode: SkillNode }

export default function SkillTreeScreen() {
  const skills = useMemo(() => yaml.load(skillsRaw), [])
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => buildGraph(skills),
    [skills]
  )

  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, , onEdgesChange] = useEdgesState(initialEdges)
  const [selected, setSelected] = useState(null)

  const onNodeClick = useCallback(
    (_, node) => setSelected(node.data),
    []
  )

  const onPaneClick = useCallback(() => setSelected(null), [])

  const minimapColor = useCallback(
    (node) => node.data?.colors?.minimap ?? "#a1abd7",
    []
  )

  return (
    <div className="h-screen w-screen flex flex-col bg-background">
      <header className="flex items-center gap-4 px-6 py-3 border-b border-outline-variant/30">
        <a
          href="/"
          className="text-primary hover:text-primary-dim transition-colors text-sm font-medium"
        >
          ← Accueil
        </a>
        <h1 className="font-headline text-lg font-bold text-on-background">
          Arbre de compétences
        </h1>
        <Legend />
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
          minZoom={0.1}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#a1abd7" gap={24} size={1} />
          <Controls position="bottom-right" />
          <MiniMap
            nodeColor={minimapColor}
            maskColor="rgba(244, 242, 255, 0.7)"
            position="bottom-left"
          />
        </ReactFlow>

        {selected && <DetailPanel skill={selected} onClose={() => setSelected(null)} />}
      </div>
    </div>
  )
}

function Legend() {
  return (
    <div className="ml-auto flex items-center gap-3">
      {Object.entries(GRADE_COLORS).map(([grade, colors]) => (
        <div key={grade} className="flex items-center gap-1.5 text-xs">
          <span
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: colors.bg, border: `1.5px solid ${colors.border}` }}
          />
          <span className="text-on-surface-variant">{grade}</span>
        </div>
      ))}
    </div>
  )
}

function DetailPanel({ skill, onClose }) {
  const colors = GRADE_COLORS[skill.grade]
  return (
    <div className="absolute top-4 right-4 w-80 glass-card ghost-border shadow-ambient rounded-xl p-5 z-50">
      <div className="flex items-start justify-between mb-3">
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full"
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
    </div>
  )
}
