import { formatNumber } from "../utils"
import { explainAddition } from "./addition"
import { explainSoustraction } from "./soustraction"
import { explainMultiplication } from "./multiplication"
import { explainDivision } from "./division"

export const generateExplanation = (question) => {
  const { text, answer, operation } = question
  const parts = text.split(/\s*[+−×÷]\s*/)
  const a = parseFloat(parts[0].replace(",", "."))
  const b = parseFloat(parts[1].replace(",", "."))

  switch (operation) {
    case "addition": return explainAddition(a, b, answer)
    case "soustraction": return explainSoustraction(a, b, answer)
    case "multiplication": return explainMultiplication(a, b, answer)
    case "division": return explainDivision(a, b, answer)
    default: return `${text} = ${formatNumber(answer)}`
  }
}
