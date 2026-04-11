import { getDecCount, toCommaStr, spaceOut } from "./helpers"

export const explainMultiplication = (a, b, answer) => {
  const isDecB = !Number.isInteger(b)

  if (Number.isInteger(a) && Number.isInteger(b) && a <= 12 && b <= 12) {
    const base = Math.min(a, b)
    const mult = Math.max(a, b)
    let r = `${a} × ${b} = ${answer}\n\nTable de ${base} :\n`
    for (let i = 1; i <= 10; i++) {
      r += `${base} × ${String(i).padStart(2)} = ${String(base * i).padStart(3)}`
      r += i === mult ? "  ←\n" : "\n"
    }
    return r
  }

  if (isDecB) {
    const decPlaces = getDecCount(b)
    const factor = Math.pow(10, decPlaces)
    const bInt = Math.round(b * factor)
    const productInt = a * bInt

    const bIntStr = String(bInt)
    const aStr = String(a)
    const prodStr = String(productInt)
    const width = Math.max(bIntStr.length, aStr.length, prodStr.length)
    const sep = "─".repeat(width * 2 + 3)

    let r = "Astuce : on multiplie sans la virgule,\npuis on la replace.\n\n"
    r += "Calcul posé (sans virgule) :\n\n"
    r += `  ${spaceOut(bIntStr.padStart(width))}\n`
    r += `× ${spaceOut(aStr.padStart(width))}\n`
    r += `${sep}\n`
    r += `  ${spaceOut(prodStr.padStart(width))}\n`

    const bDigits = bIntStr.split("").reverse().map(Number)
    r += "\nDétail :\n"
    let carry = 0
    for (let i = 0; i < bDigits.length; i++) {
      const prod = a * bDigits[i] + carry
      const digit = prod % 10
      const newCarry = Math.floor(prod / 10)
      let s = `${a} × ${bDigits[i]}`
      if (carry > 0) s += ` + ${carry} (retenue)`
      s += ` = ${prod}`
      if (newCarry > 0) s += ` → on écrit ${digit}, retenue ${newCarry}`
      r += s + "\n"
      carry = newCarry
    }
    if (carry > 0) r += `Retenue : ${carry}\n`

    r += `\n→ ${a} × ${bInt} = ${productInt}`
    r += `\nOn remet la virgule (${decPlaces} chiffre${decPlaces > 1 ? "s" : ""} après) :`
    r += `\n${a} × ${toCommaStr(b)} = ${toCommaStr(answer)}`
    return r
  }

  return `${a} × ${b} = ${answer}`
}
