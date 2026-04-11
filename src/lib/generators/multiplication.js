import { randInt, pickRandom, randDecimal, formatNumber, roundDec } from "../utils"

export default {
  P2: () => { const t = pickRandom([2, 5, 10]), n = randInt(1, 10); return { text: `${t} × ${n}`, answer: t * n } },
  P3: () => { const t = pickRandom([2, 3, 4, 5, 6, 10]), n = randInt(2, Math.min(10, Math.floor(100 / t))); return { text: `${t} × ${n}`, answer: t * n } },
  P4: () => { const t = randInt(2, 10), n = randInt(2, Math.min(10, Math.floor(1000 / t))); return { text: `${t} × ${n}`, answer: t * n } },
  P5: () => { const a = randInt(2, 12), b = randDecimal(1, 9, 1); return { text: `${a} × ${formatNumber(b)}`, answer: roundDec(a * b, 1) } },
  P6: () => { const a = randInt(2, 12), b = randDecimal(1, 9, 1); return { text: `${a} × ${formatNumber(b)}`, answer: roundDec(a * b, 1) } }
}
