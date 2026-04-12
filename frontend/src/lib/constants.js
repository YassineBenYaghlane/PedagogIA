export const LEVELS = ["P1", "P2", "P3", "P4", "P5", "P6"]
export const OPERATIONS = ["addition", "soustraction", "multiplication", "division"]

export const opLabels = {
  addition: "Addition",
  soustraction: "Soustraction",
  multiplication: "Multiplication",
  division: "Division"
}

export const opIcons = {
  addition: "add_circle",
  soustraction: "remove_circle",
  multiplication: "close",
  division: "percent"
}

export const opStartLevel = {
  addition: "P1",
  soustraction: "P1",
  multiplication: "P2",
  division: "P3"
}

export const levelColors = {
  P1: "bg-tertiary-container/40 text-on-tertiary-container",
  P2: "bg-secondary-container/40 text-on-secondary-container",
  P3: "bg-primary-container/40 text-on-primary-container",
  P4: "bg-tertiary-container/40 text-on-tertiary-container",
  P5: "bg-primary-container/40 text-on-primary-container",
  P6: "bg-surface-variant text-on-surface"
}

export const opGradients = {
  addition: "from-primary to-primary-container",
  soustraction: "from-tertiary to-tertiary-container",
  multiplication: "from-secondary to-secondary-container",
  division: "from-primary-dim to-primary"
}

export const opTextColors = {
  addition: "text-primary",
  soustraction: "text-tertiary",
  multiplication: "text-secondary",
  division: "text-primary-dim"
}

export const levelDescriptions = {
  P1: "1ère primaire",
  P2: "2ème primaire",
  P3: "3ème primaire",
  P4: "4ème primaire",
  P5: "5ème primaire",
  P6: "6ème primaire"
}
