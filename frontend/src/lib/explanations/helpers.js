export const toCommaStr = (n) =>
  String(n).replace(".", ",")

export const getDecCount = (n) => {
  const s = String(n)
  const dot = s.indexOf(".")
  return dot === -1 ? 0 : s.length - dot - 1
}

export const spaceOut = (str) =>
  str
    .split("")
    .map((c) => (c === " " ? "  " : c === "," ? " ," : " " + c))
    .join("")

export const normalizeForPose = (nums) => {
  const strs = nums.map(toCommaStr)
  const parts = strs.map((s) => {
    const [intP, decP = ""] = s.split(",")
    return { intP, decP }
  })
  const maxInt = Math.max(...parts.map((p) => p.intP.length))
  const maxDec = Math.max(...parts.map((p) => p.decP.length))
  const padded = parts.map((p) => {
    const pi = p.intP.padStart(maxInt, " ")
    if (maxDec > 0) return pi + "," + p.decP.padEnd(maxDec, "0")
    return pi
  })
  return { padded, maxDec }
}

export const getPlaceNames = (maxDec) => {
  const names = []
  if (maxDec >= 3) names.push("Millièmes")
  if (maxDec >= 2) names.push("Centièmes")
  if (maxDec >= 1) names.push("Dixièmes")
  names.push("Unités", "Dizaines", "Centaines", "Milliers", "Diz. milliers")
  return names
}
