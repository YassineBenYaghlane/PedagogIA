import { randInt, pickRandom } from "../utils"

export default {
  P3: () => { const d = pickRandom([2, 3, 4, 5, 6, 10]), q = randInt(2, 10); return { text: `${d * q} ÷ ${d}`, answer: q } },
  P4: () => { const d = randInt(2, 10), q = randInt(2, 12); return { text: `${d * q} ÷ ${d}`, answer: q } },
  P5: () => { const d = randInt(2, 10); let qx10; do { qx10 = randInt(10, Math.min(100, Math.floor(100 / d) * 10)) } while ((d * qx10) % 10 !== 0); const q = qx10 / 10, dd = (d * qx10) / 10; return { text: `${dd} ÷ ${d}`, answer: q } },
  P6: () => { const d = randInt(2, 20); let qx10; do { qx10 = randInt(10, 100) } while ((d * qx10) % 10 !== 0); const q = qx10 / 10, dd = (d * qx10) / 10; return { text: `${dd} ÷ ${d}`, answer: q } }
}
