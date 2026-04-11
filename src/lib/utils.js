export const randInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min

export const pickRandom = (arr) =>
  arr[Math.floor(Math.random() * arr.length)]

export const roundDec = (n, decimals) => {
  const f = Math.pow(10, decimals)
  return Math.round(n * f) / f
}

export const formatNumber = (n) =>
  String(n).replace(".", ",")

export const randDecimal = (min, max, decimals) => {
  const factor = Math.pow(10, decimals)
  const minInt = Math.ceil(min * factor)
  const maxInt = Math.floor(max * factor)
  return randInt(minInt, maxInt) / factor
}
