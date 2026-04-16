import { createContext } from "react"

export const SkillTreeHoverContext = createContext({
  hoveredId: null,
  prereqs: new Set()
})
