import { randInt, randDecimal, formatNumber, roundDec } from "../utils"

export default {
  P1: () => { const a = randInt(1, 10), b = randInt(0, a); return { text: `${a} − ${b}`, answer: a - b } },
  P2: () => { const a = randInt(10, 50), b = randInt(1, a); return { text: `${a} − ${b}`, answer: a - b } },
  P3: () => { const a = randInt(200, 999), b = randInt(100, a); return { text: `${a} − ${b}`, answer: a - b } },
  P4: () => { const a = randInt(2000, 9999), b = randInt(1000, a); return { text: `${a} − ${b}`, answer: a - b } },
  P5: () => { const a = randDecimal(10, 99, 2), b = randDecimal(1, 9, 2); return { text: `${formatNumber(a)} − ${formatNumber(b)}`, answer: roundDec(a - b, 2) } },
  P6: () => { const a = randDecimal(10, 99, 3), b = randDecimal(1, 9, 3); return { text: `${formatNumber(a)} − ${formatNumber(b)}`, answer: roundDec(a - b, 3) } }
}
