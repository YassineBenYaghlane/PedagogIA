import { normalizeForPose, spaceOut, getPlaceNames } from "./helpers"

export const explainAddition = (a, b, answer) => {
  if (a <= 20 && b <= 20) {
    return `${a} + ${b} = ${answer}`
  }

  const { padded, maxDec } = normalizeForPose([a, b, answer])
  const [aPad, bPad, ansPad] = padded
  const w = spaceOut(aPad).length
  const sep = "─".repeat(w + 2)
  const places = getPlaceNames(maxDec)

  let r = "Calcul posé :\n\n"
  r += `  ${spaceOut(aPad)}\n`
  r += `+ ${spaceOut(bPad)}\n`
  r += `${sep}\n`
  r += `  ${spaceOut(ansPad)}\n`

  const factor = Math.pow(10, maxDec)
  const aDigits = String(Math.round(a * factor)).split("").reverse().map(Number)
  const bDigits = String(Math.round(b * factor)).split("").reverse().map(Number)

  r += "\nDétail :\n"
  let carry = 0
  for (let i = 0; i < Math.max(aDigits.length, bDigits.length); i++) {
    const da = aDigits[i] || 0
    const db = bDigits[i] || 0
    const sum = da + db + carry
    const digit = sum % 10
    const newCarry = Math.floor(sum / 10)

    let s = `${places[i]} : ${da} + ${db}`
    if (carry > 0) s += ` + ${carry} (retenue)`
    s += ` = ${sum}`
    if (newCarry > 0) s += ` → on écrit ${digit}, retenue ${newCarry}`
    r += s + "\n"
    carry = newCarry
  }
  if (carry > 0) r += `Retenue finale : ${carry}\n`

  return r
}
