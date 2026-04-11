import { randInt, randDecimal, formatNumber, roundDec } from "../utils"

export default {
  P1: () => { const a = randInt(1, 10), b = randInt(1, 10); return { text: `${a} + ${b}`, answer: a + b } },
  P2: () => { const a = randInt(10, 50), b = randInt(10, 50); return { text: `${a} + ${b}`, answer: a + b } },
  P3: () => { const a = randInt(100, 500), b = randInt(100, 500); return { text: `${a} + ${b}`, answer: a + b } },
  P4: () => { const a = randInt(1000, 5000), b = randInt(1000, 5000); return { text: `${a} + ${b}`, answer: a + b } },
  P5: () => { const a = randDecimal(1, 50, 2), b = randDecimal(1, 50, 2); return { text: `${formatNumber(a)} + ${formatNumber(b)}`, answer: roundDec(a + b, 2) } },
  P6: () => { const a = randDecimal(1, 50, 3), b = randDecimal(1, 50, 3); return { text: `${formatNumber(a)} + ${formatNumber(b)}`, answer: roundDec(a + b, 3) } }
}
