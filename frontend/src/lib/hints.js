export const HINT_LEVELS = ["strategy", "step", "solution"]

export const hintLabels = {
  strategy: "Indice — stratégie",
  step: "Indice — étape",
  solution: "Solution complète"
}

export function nextHintLevel(current) {
  if (current === null) return "strategy"
  const idx = HINT_LEVELS.indexOf(current)
  if (idx === -1 || idx === HINT_LEVELS.length - 1) return null
  return HINT_LEVELS[idx + 1]
}

export function buildHint(exercise, level) {
  if (!exercise) return ""
  const params = exercise.params || {}
  const op = params.op || params.operation
  switch (level) {
    case "strategy":
      return strategyHint(exercise.type, op)
    case "step":
      return stepHint(params, op)
    case "solution":
      return `Réponse attendue : ${params.expected ?? "(cachée — réessaie d'abord)"}`
    default:
      return ""
  }
}

function strategyHint(type, op) {
  if (type === "comparison") return "Compare les deux nombres en partant des plus grandes positions."
  if (type === "decomposition") return "Décompose le nombre en dizaines et unités."
  if (op === "+") return "Pose l'addition et n'oublie pas la retenue si la somme dépasse 9."
  if (op === "-") return "Pose la soustraction colonne par colonne, du chiffre des unités vers la gauche."
  if (op === "*" || op === "x") return "Utilise la table de multiplication adaptée."
  if (op === "/") return "Cherche combien de fois le diviseur entre dans le dividende."
  return "Reprends l'énoncé étape par étape."
}

function stepHint(params, op) {
  const a = params.a
  const b = params.b
  if (a === undefined || b === undefined) return "Reprends la première étape avec attention."
  if (op === "+") return `Commence par ajouter les unités : ${a % 10} + ${b % 10}.`
  if (op === "-") return `Commence par soustraire les unités : ${a % 10} − ${b % 10}.`
  if (op === "*" || op === "x") return `Calcule d'abord ${a} × ${b % 10}.`
  if (op === "/") return `Cherche combien de fois ${b} entre dans ${a}.`
  return "Avance d'une étape à la fois."
}
