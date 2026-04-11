import { toCommaStr } from "./helpers"

export const explainDivision = (a, b, answer) => {
  if (Number.isInteger(answer) && b <= 12) {
    const start = Math.max(1, answer - 2)
    const end = Math.min(10, answer + 2)
    let r = `${a} ÷ ${b} = ${answer}\n\nOn cherche : ${b} × ? = ${a}\n\nTable de ${b} :\n`
    for (let i = start; i <= end; i++) {
      r += `${b} × ${String(i).padStart(2)} = ${String(b * i).padStart(3)}`
      r += i === answer ? "  ←\n" : "\n"
    }
    r += `\nDonc ${a} ÷ ${b} = ${answer}`
    return r
  }

  if (Number.isInteger(answer)) {
    return `${a} ÷ ${b} = ${answer}\n\n${b} × ${answer} = ${a}\nDonc ${a} ÷ ${b} = ${answer}`
  }

  const intPart = Math.floor(a / b)
  const remainder = a - intPart * b
  const decDigit = Math.round((remainder * 10) / b)

  let r = "Division posée :\n\n"
  r += ` ${a}  │ ${b}\n`
  r += `${" ".repeat(String(a).length + 2)}│${"─".repeat(String(b).length + 2)}\n`
  r += `${" ".repeat(String(a).length + 2)}│ ${toCommaStr(answer)}\n\n`

  r += "Étape 1 : partie entière\n"
  r += `  ${a} ÷ ${b} → ${b} × ${intPart} = ${b * intPart}`
  r += `, reste ${remainder}\n\n`

  r += "Étape 2 : après la virgule\n"
  r += `  On abaisse un 0 : ${remainder}0 ÷ ${b}\n`
  r += `  ${b} × ${decDigit} = ${b * decDigit}\n\n`

  r += `Résultat : ${a} ÷ ${b} = ${toCommaStr(answer)}`
  return r
}
