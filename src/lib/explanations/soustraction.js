import { normalizeForPose, spaceOut, getPlaceNames } from "./helpers"

export const explainSoustraction = (a, b, answer) => {
  if (a <= 20 && b <= 20) {
    return `${a} − ${b} = ${answer}\nOn enlève ${b} à ${a}.`
  }

  const { padded, maxDec } = normalizeForPose([a, b, answer])
  const [aPad, bPad, ansPad] = padded
  const w = spaceOut(aPad).length
  const sep = "─".repeat(w + 2)
  const places = getPlaceNames(maxDec)

  let r = "Calcul posé :\n\n"
  r += `  ${spaceOut(aPad)}\n`
  r += `− ${spaceOut(bPad)}\n`
  r += `${sep}\n`
  r += `  ${spaceOut(ansPad)}\n`

  const factor = Math.pow(10, maxDec)
  const aDigits = String(Math.round(a * factor)).split("").reverse().map(Number)
  const bDigits = String(Math.round(b * factor)).split("").reverse().map(Number)

  r += "\nDétail :\n"
  let borrow = 0
  for (let i = 0; i < Math.max(aDigits.length, bDigits.length); i++) {
    const da = aDigits[i] || 0
    const db = bDigits[i] || 0
    const effective = da - borrow

    let s = `${places[i]} : ${da}`

    if (effective >= db) {
      if (borrow > 0 && db > 0) s += ` − ${borrow} (emprunt) − ${db} = ${effective - db}`
      else if (borrow > 0) s += ` − ${borrow} (emprunt) = ${effective}`
      else s += ` − ${db} = ${effective - db}`
      borrow = 0
    } else {
      if (borrow > 0 && db > 0) {
        s += ` − ${borrow} (emprunt) − ${db} → impossible !`
        s += `\n  On emprunte : ${da + 10} − ${borrow} − ${db} = ${effective + 10 - db}`
      } else if (borrow > 0) {
        s += ` − ${borrow} (emprunt) → impossible !`
        s += `\n  On emprunte : ${da + 10} − ${borrow} = ${effective + 10}`
      } else {
        s += ` − ${db} → impossible !`
        s += `\n  On emprunte : ${da + 10} − ${db} = ${da + 10 - db}`
      }
      borrow = 1
    }
    r += s + "\n"
  }

  return r
}
