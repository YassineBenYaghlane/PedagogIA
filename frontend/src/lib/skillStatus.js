// Backend StudentSkillState.status — 6 tiers, see apps/students/models.py
export const STATUS_LABEL = {
  not_started: "À découvrir",
  learning_easy: "Découverte",
  learning_medium: "En cours",
  learning_hard: "Presque acquis",
  mastered: "Acquis",
  needs_review: "À revoir",
}

export const STATUS_DOT = {
  not_started: "#A1AEA3",
  learning_easy: "#C7E0B5",
  learning_medium: "#6FA274",
  learning_hard: "#3F6F4A",
  mastered: "#E8C66A",
  needs_review: "#4F8BAC",
}

// Frontend-derived state used by skill-tree visuals (SkillNode, SkillListView).
// Computed by sentierStatusFor() in SkillTreeScreen.
export const SENTIER_LABEL = {
  done: "Acquis",
  in_progress: "En cours",
  wilted: "À revoir",
  unlocked: "À commencer",
  locked: "À découvrir",
}

export const SENTIER_DOT = {
  done: "#E8C66A",
  in_progress: "#6FA274",
  wilted: "#4F8BAC",
  unlocked: "#C7E0B5",
  locked: "#A1AEA3",
}
