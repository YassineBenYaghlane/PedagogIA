import { useState, useRef, useEffect } from "react";
import "./App.css";

// --- Utilitaires ---

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function roundDec(n, decimals) {
  const f = Math.pow(10, decimals);
  return Math.round(n * f) / f;
}

function formatNumber(n) {
  return String(n).replace(".", ",");
}

function randDecimal(min, max, decimals) {
  const factor = Math.pow(10, decimals);
  const minInt = Math.ceil(min * factor);
  const maxInt = Math.floor(max * factor);
  return randInt(minInt, maxInt) / factor;
}

// --- Générateurs par opération ET par niveau ---
// Chaque générateur retourne { text, answer }

const generators = {
  addition: {
    P1: () => { const a = randInt(1, 10), b = randInt(1, 10); return { text: `${a} + ${b}`, answer: a + b }; },
    P2: () => { const a = randInt(10, 50), b = randInt(10, 50); return { text: `${a} + ${b}`, answer: a + b }; },
    P3: () => { const a = randInt(100, 500), b = randInt(100, 500); return { text: `${a} + ${b}`, answer: a + b }; },
    P4: () => { const a = randInt(1000, 5000), b = randInt(1000, 5000); return { text: `${a} + ${b}`, answer: a + b }; },
    P5: () => { const a = randDecimal(1, 50, 2), b = randDecimal(1, 50, 2); return { text: `${formatNumber(a)} + ${formatNumber(b)}`, answer: roundDec(a + b, 2) }; },
    P6: () => { const a = randDecimal(1, 50, 3), b = randDecimal(1, 50, 3); return { text: `${formatNumber(a)} + ${formatNumber(b)}`, answer: roundDec(a + b, 3) }; },
  },
  soustraction: {
    P1: () => { const a = randInt(1, 10), b = randInt(0, a); return { text: `${a} − ${b}`, answer: a - b }; },
    P2: () => { const a = randInt(10, 50), b = randInt(1, a); return { text: `${a} − ${b}`, answer: a - b }; },
    P3: () => { const a = randInt(200, 999), b = randInt(100, a); return { text: `${a} − ${b}`, answer: a - b }; },
    P4: () => { const a = randInt(2000, 9999), b = randInt(1000, a); return { text: `${a} − ${b}`, answer: a - b }; },
    P5: () => { const a = randDecimal(10, 99, 2), b = randDecimal(1, 9, 2); return { text: `${formatNumber(a)} − ${formatNumber(b)}`, answer: roundDec(a - b, 2) }; },
    P6: () => { const a = randDecimal(10, 99, 3), b = randDecimal(1, 9, 3); return { text: `${formatNumber(a)} − ${formatNumber(b)}`, answer: roundDec(a - b, 3) }; },
  },
  multiplication: {
    P2: () => { const t = pickRandom([2, 5, 10]), n = randInt(1, 10); return { text: `${t} × ${n}`, answer: t * n }; },
    P3: () => { const t = pickRandom([2, 3, 4, 5, 6, 10]), n = randInt(2, Math.min(10, Math.floor(100 / t))); return { text: `${t} × ${n}`, answer: t * n }; },
    P4: () => { const t = randInt(2, 10), n = randInt(2, Math.min(10, Math.floor(1000 / t))); return { text: `${t} × ${n}`, answer: t * n }; },
    P5: () => { const a = randInt(2, 12), b = randDecimal(1, 9, 1); return { text: `${a} × ${formatNumber(b)}`, answer: roundDec(a * b, 1) }; },
    P6: () => { const a = randInt(2, 12), b = randDecimal(1, 9, 1); return { text: `${a} × ${formatNumber(b)}`, answer: roundDec(a * b, 1) }; },
  },
  division: {
    P3: () => { const d = pickRandom([2, 3, 4, 5, 6, 10]), q = randInt(2, 10); return { text: `${d * q} ÷ ${d}`, answer: q }; },
    P4: () => { const d = randInt(2, 10), q = randInt(2, 12); return { text: `${d * q} ÷ ${d}`, answer: q }; },
    P5: () => { const d = randInt(2, 10); let qx10; do { qx10 = randInt(10, Math.min(100, Math.floor(100 / d) * 10)); } while ((d * qx10) % 10 !== 0); const q = qx10 / 10, dd = (d * qx10) / 10; return { text: `${dd} ÷ ${d}`, answer: q }; },
    P6: () => { const d = randInt(2, 20); let qx10; do { qx10 = randInt(10, 100); } while ((d * qx10) % 10 !== 0); const q = qx10 / 10, dd = (d * qx10) / 10; return { text: `${dd} ÷ ${d}`, answer: q }; },
  },
};

const LEVELS = ["P1", "P2", "P3", "P4", "P5", "P6"];
const OPERATIONS = ["addition", "soustraction", "multiplication", "division"];

const opLabels = {
  addition: "Addition",
  soustraction: "Soustraction",
  multiplication: "Multiplication",
  division: "Division",
};

const opIcons = {
  addition: "add_circle",
  soustraction: "remove_circle",
  multiplication: "close",
  division: "percent",
};

// Niveaux de départ par opération (le plus bas disponible)
const opStartLevel = {
  addition: "P1",
  soustraction: "P1",
  multiplication: "P2",
  division: "P3",
};

// --- Calcul écrit (posé) pour les explications ---

function toCommaStr(n) {
  return String(n).replace(".", ",");
}

function getDecCount(n) {
  const s = String(n);
  const dot = s.indexOf(".");
  return dot === -1 ? 0 : s.length - dot - 1;
}

function spaceOut(str) {
  return str
    .split("")
    .map((c) => (c === " " ? "  " : c === "," ? " ," : " " + c))
    .join("");
}

function normalizeForPose(nums) {
  const strs = nums.map(toCommaStr);
  const parts = strs.map((s) => {
    const [intP, decP = ""] = s.split(",");
    return { intP, decP };
  });
  const maxInt = Math.max(...parts.map((p) => p.intP.length));
  const maxDec = Math.max(...parts.map((p) => p.decP.length));
  const padded = parts.map((p) => {
    const pi = p.intP.padStart(maxInt, " ");
    if (maxDec > 0) return pi + "," + p.decP.padEnd(maxDec, "0");
    return pi;
  });
  return { padded, maxDec };
}

function getPlaceNames(maxDec) {
  const names = [];
  if (maxDec >= 3) names.push("Millièmes");
  if (maxDec >= 2) names.push("Centièmes");
  if (maxDec >= 1) names.push("Dixièmes");
  names.push("Unités", "Dizaines", "Centaines", "Milliers", "Diz. milliers");
  return names;
}

// --- Addition posée ---

function explainAddition(a, b, answer) {
  if (a <= 20 && b <= 20) {
    return `${a} + ${b} = ${answer}`;
  }

  const { padded, maxDec } = normalizeForPose([a, b, answer]);
  const [aPad, bPad, ansPad] = padded;
  const w = spaceOut(aPad).length;
  const sep = "─".repeat(w + 2);
  const places = getPlaceNames(maxDec);

  let r = "Calcul posé :\n\n";
  r += `  ${spaceOut(aPad)}\n`;
  r += `+ ${spaceOut(bPad)}\n`;
  r += `${sep}\n`;
  r += `  ${spaceOut(ansPad)}\n`;

  const factor = Math.pow(10, maxDec);
  const aDigits = String(Math.round(a * factor)).split("").reverse().map(Number);
  const bDigits = String(Math.round(b * factor)).split("").reverse().map(Number);

  r += "\nDétail :\n";
  let carry = 0;
  for (let i = 0; i < Math.max(aDigits.length, bDigits.length); i++) {
    const da = aDigits[i] || 0;
    const db = bDigits[i] || 0;
    const sum = da + db + carry;
    const digit = sum % 10;
    const newCarry = Math.floor(sum / 10);

    let s = `${places[i]} : ${da} + ${db}`;
    if (carry > 0) s += ` + ${carry} (retenue)`;
    s += ` = ${sum}`;
    if (newCarry > 0) s += ` → on écrit ${digit}, retenue ${newCarry}`;
    r += s + "\n";
    carry = newCarry;
  }
  if (carry > 0) r += `Retenue finale : ${carry}\n`;

  return r;
}

// --- Soustraction posée ---

function explainSoustraction(a, b, answer) {
  if (a <= 20 && b <= 20) {
    return `${a} − ${b} = ${answer}\nOn enlève ${b} à ${a}.`;
  }

  const { padded, maxDec } = normalizeForPose([a, b, answer]);
  const [aPad, bPad, ansPad] = padded;
  const w = spaceOut(aPad).length;
  const sep = "─".repeat(w + 2);
  const places = getPlaceNames(maxDec);

  let r = "Calcul posé :\n\n";
  r += `  ${spaceOut(aPad)}\n`;
  r += `− ${spaceOut(bPad)}\n`;
  r += `${sep}\n`;
  r += `  ${spaceOut(ansPad)}\n`;

  const factor = Math.pow(10, maxDec);
  const aDigits = String(Math.round(a * factor)).split("").reverse().map(Number);
  const bDigits = String(Math.round(b * factor)).split("").reverse().map(Number);

  r += "\nDétail :\n";
  let borrow = 0;
  for (let i = 0; i < Math.max(aDigits.length, bDigits.length); i++) {
    const da = aDigits[i] || 0;
    const db = bDigits[i] || 0;
    const effective = da - borrow;

    let s = `${places[i]} : ${da}`;

    if (effective >= db) {
      if (borrow > 0 && db > 0) s += ` − ${borrow} (emprunt) − ${db} = ${effective - db}`;
      else if (borrow > 0) s += ` − ${borrow} (emprunt) = ${effective}`;
      else s += ` − ${db} = ${effective - db}`;
      borrow = 0;
    } else {
      if (borrow > 0 && db > 0) {
        s += ` − ${borrow} (emprunt) − ${db} → impossible !`;
        s += `\n  On emprunte : ${da + 10} − ${borrow} − ${db} = ${effective + 10 - db}`;
      } else if (borrow > 0) {
        s += ` − ${borrow} (emprunt) → impossible !`;
        s += `\n  On emprunte : ${da + 10} − ${borrow} = ${effective + 10}`;
      } else {
        s += ` − ${db} → impossible !`;
        s += `\n  On emprunte : ${da + 10} − ${db} = ${da + 10 - db}`;
      }
      borrow = 1;
    }
    r += s + "\n";
  }

  return r;
}

// --- Multiplication posée ---

function explainMultiplication(a, b, answer) {
  const isDecB = !Number.isInteger(b);

  // Table simple (deux entiers, a ≤ 12)
  if (Number.isInteger(a) && Number.isInteger(b) && a <= 12 && b <= 12) {
    const base = Math.min(a, b);
    const mult = Math.max(a, b);
    let r = `${a} × ${b} = ${answer}\n\nTable de ${base} :\n`;
    for (let i = 1; i <= 10; i++) {
      r += `${base} × ${String(i).padStart(2)} = ${String(base * i).padStart(3)}`;
      r += i === mult ? "  ←\n" : "\n";
    }
    return r;
  }

  // Multiplication avec décimal : entier × décimal
  if (isDecB) {
    const decPlaces = getDecCount(b);
    const factor = Math.pow(10, decPlaces);
    const bInt = Math.round(b * factor);
    const productInt = a * bInt;

    const bIntStr = String(bInt);
    const aStr = String(a);
    const prodStr = String(productInt);
    const width = Math.max(bIntStr.length, aStr.length, prodStr.length);
    const sep = "─".repeat(width * 2 + 3);

    let r = `Astuce : on multiplie sans la virgule,\npuis on la replace.\n\n`;
    r += `Calcul posé (sans virgule) :\n\n`;
    r += `  ${spaceOut(bIntStr.padStart(width))}\n`;
    r += `× ${spaceOut(aStr.padStart(width))}\n`;
    r += `${sep}\n`;
    r += `  ${spaceOut(prodStr.padStart(width))}\n`;

    const bDigits = bIntStr.split("").reverse().map(Number);
    r += "\nDétail :\n";
    let carry = 0;
    for (let i = 0; i < bDigits.length; i++) {
      const prod = a * bDigits[i] + carry;
      const digit = prod % 10;
      const newCarry = Math.floor(prod / 10);
      let s = `${a} × ${bDigits[i]}`;
      if (carry > 0) s += ` + ${carry} (retenue)`;
      s += ` = ${prod}`;
      if (newCarry > 0) s += ` → on écrit ${digit}, retenue ${newCarry}`;
      r += s + "\n";
      carry = newCarry;
    }
    if (carry > 0) r += `Retenue : ${carry}\n`;

    r += `\n→ ${a} × ${bInt} = ${productInt}`;
    r += `\nOn remet la virgule (${decPlaces} chiffre${decPlaces > 1 ? "s" : ""} après) :`;
    r += `\n${a} × ${toCommaStr(b)} = ${toCommaStr(answer)}`;
    return r;
  }

  return `${a} × ${b} = ${answer}`;
}

// --- Division posée ---

function explainDivision(a, b, answer) {
  // Résultat entier → table
  if (Number.isInteger(answer) && b <= 12) {
    const start = Math.max(1, answer - 2);
    const end = Math.min(10, answer + 2);
    let r = `${a} ÷ ${b} = ${answer}\n\nOn cherche : ${b} × ? = ${a}\n\nTable de ${b} :\n`;
    for (let i = start; i <= end; i++) {
      r += `${b} × ${String(i).padStart(2)} = ${String(b * i).padStart(3)}`;
      r += i === answer ? "  ←\n" : "\n";
    }
    r += `\nDonc ${a} ÷ ${b} = ${answer}`;
    return r;
  }

  // Résultat entier, grand diviseur
  if (Number.isInteger(answer)) {
    return `${a} ÷ ${b} = ${answer}\n\n${b} × ${answer} = ${a}\nDonc ${a} ÷ ${b} = ${answer}`;
  }

  // Résultat décimal → division posée
  const intPart = Math.floor(a / b);
  const remainder = a - intPart * b;
  const decDigit = Math.round((remainder * 10) / b);

  let r = `Division posée :\n\n`;
  r += ` ${a}  │ ${b}\n`;
  r += `${" ".repeat(String(a).length + 2)}│${"─".repeat(String(b).length + 2)}\n`;
  r += `${" ".repeat(String(a).length + 2)}│ ${toCommaStr(answer)}\n\n`;

  r += `Étape 1 : partie entière\n`;
  r += `  ${a} ÷ ${b} → ${b} × ${intPart} = ${b * intPart}`;
  r += `, reste ${remainder}\n\n`;

  r += `Étape 2 : après la virgule\n`;
  r += `  On abaisse un 0 : ${remainder}0 ÷ ${b}\n`;
  r += `  ${b} × ${decDigit} = ${b * decDigit}\n\n`;

  r += `Résultat : ${a} ÷ ${b} = ${toCommaStr(answer)}`;
  return r;
}

// --- Dispatcher ---

function generateExplanation(question) {
  const { text, answer, operation } = question;
  const parts = text.split(/\s*[+−×÷]\s*/);
  const a = parseFloat(parts[0].replace(",", "."));
  const b = parseFloat(parts[1].replace(",", "."));

  switch (operation) {
    case "addition": return explainAddition(a, b, answer);
    case "soustraction": return explainSoustraction(a, b, answer);
    case "multiplication": return explainMultiplication(a, b, answer);
    case "division": return explainDivision(a, b, answer);
    default: return `${text} = ${formatNumber(answer)}`;
  }
}

// --- Algorithme adaptatif ---
// Pour chaque opération, on commence au niveau de départ.
// Si correct → on monte d'un niveau. Si faux → on descend ou on reste.
// On pose ~5 questions par opération = 20 questions total.
// On enregistre chaque résultat { operation, level, correct }.

function buildTestPlan() {
  // 5 questions par opération, en round-robin pour varier
  const plan = [];
  const currentLevels = { ...opStartLevel };
  const questionsPerOp = { addition: 0, soustraction: 0, multiplication: 0, division: 0 };
  const maxPerOp = 5;

  // On alterne les opérations en round-robin
  let round = 0;
  while (plan.length < 20) {
    for (const op of OPERATIONS) {
      if (questionsPerOp[op] >= maxPerOp) continue;
      if (plan.length >= 20) break;

      const level = currentLevels[op];
      const gen = generators[op][level];
      if (!gen) continue;

      const q = gen();
      plan.push({
        ...q,
        operation: op,
        level,
        // On stockera le résultat après réponse
      });
      questionsPerOp[op]++;
    }
    round++;
    if (round > 10) break; // sécurité
  }

  return plan;
}

function getNextLevel(currentLevel, correct, op) {
  const available = Object.keys(generators[op]);
  const idx = available.indexOf(currentLevel);
  if (correct && idx < available.length - 1) return available[idx + 1];
  if (!correct && idx > 0) return available[idx - 1];
  return currentLevel;
}

// --- Analyse des résultats ---

function analyzeResults(results) {
  // Par opération : niveau le plus haut réussi de manière fiable
  const byOp = {};
  for (const op of OPERATIONS) {
    byOp[op] = results.filter((r) => r.operation === op);
  }

  const opAnalysis = {};
  for (const op of OPERATIONS) {
    const opResults = byOp[op];
    if (opResults.length === 0) {
      opAnalysis[op] = { maxLevel: null, score: 0, total: 0, details: [] };
      continue;
    }

    // Grouper par niveau
    const byLevel = {};
    for (const r of opResults) {
      if (!byLevel[r.level]) byLevel[r.level] = [];
      byLevel[r.level].push(r.correct);
    }

    // Le niveau maîtrisé = le plus haut niveau où l'élève a réussi au moins 1 question
    let maxLevel = null;
    const availableLevels = Object.keys(generators[op]);
    for (const lvl of availableLevels) {
      if (byLevel[lvl] && byLevel[lvl].some((c) => c)) {
        maxLevel = lvl;
      }
    }

    const correct = opResults.filter((r) => r.correct).length;

    opAnalysis[op] = {
      maxLevel,
      score: correct,
      total: opResults.length,
      details: byLevel,
    };
  }

  // Niveau global estimé = le niveau médian des opérations
  const levels = OPERATIONS.map((op) => opAnalysis[op].maxLevel).filter(Boolean);
  const levelIndices = levels.map((l) => LEVELS.indexOf(l));
  const avgIndex = levelIndices.length > 0 ? Math.round(levelIndices.reduce((a, b) => a + b, 0) / levelIndices.length) : 0;
  const estimatedLevel = LEVELS[avgIndex];

  // Points forts et faibles
  const strengths = [];
  const weaknesses = [];
  for (const op of OPERATIONS) {
    const a = opAnalysis[op];
    if (a.total === 0) continue;
    const ratio = a.score / a.total;
    if (ratio >= 0.7) {
      strengths.push(op);
    } else {
      weaknesses.push(op);
    }
  }

  return { opAnalysis, estimatedLevel, strengths, weaknesses, totalCorrect: results.filter((r) => r.correct).length, totalQuestions: results.length };
}

// --- Composants ---

function Icon({ name, fill, className = "" }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={fill ? { fontVariationSettings: "'FILL' 1" } : undefined}
    >
      {name}
    </span>
  );
}

function WelcomeScreen({ onStart }) {
  return (
    <div className="min-h-screen bg-background font-body text-on-surface flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background orbs */}
      <div className="bg-orb absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 opacity-50" />
      <div className="bg-orb absolute top-[60%] -right-[5%] w-[30%] h-[30%] bg-secondary-container/20 opacity-50" />

      <div className="bg-surface-container-lowest rounded-xl shadow-ambient p-8 md:p-12 max-w-lg w-full text-center ghost-border relative z-10">
        {/* Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary to-primary-container flex items-center justify-center shadow-lg">
          <Icon name="calculate" fill className="text-4xl text-on-primary" />
        </div>

        <h1 className="font-headline text-4xl md:text-5xl font-extrabold text-primary mb-4 tracking-tight">
          Test de niveau
        </h1>
        <p className="text-on-surface-variant text-lg mb-6 max-w-sm mx-auto">
          Ce test va évaluer ton niveau en calcul à travers <strong className="text-on-surface">20 questions</strong> qui s'adaptent à toi.
        </p>

        <div className="bg-surface-container-low rounded-xl p-5 mb-8 text-left space-y-3">
          <p className="text-on-surface font-headline font-bold flex items-center gap-2">
            <Icon name="info" className="text-primary" />
            Comment ça marche ?
          </p>
          <ul className="text-on-surface-variant space-y-2 ml-1">
            <li className="flex items-start gap-3">
              <Icon name="trending_up" className="text-tertiary text-lg mt-0.5" />
              <span>Les questions commencent faciles et deviennent plus dures</span>
            </li>
            <li className="flex items-start gap-3">
              <Icon name="apps" className="text-primary text-lg mt-0.5" />
              <span>On teste les 4 opérations : addition, soustraction, multiplication, division</span>
            </li>
            <li className="flex items-start gap-3">
              <Icon name="insights" className="text-secondary text-lg mt-0.5" />
              <span>À la fin, tu découvriras ton niveau estimé et les compétences à travailler</span>
            </li>
          </ul>
        </div>

        <button
          onClick={onStart}
          className="gradient-soul text-on-primary font-headline font-bold text-xl w-full py-5 rounded-xl
            shadow-[0_12px_24px_rgba(0,89,182,0.3)] spring-hover cursor-pointer flex items-center justify-center gap-3"
        >
          Commencer le test
          <Icon name="arrow_forward" className="transition-transform group-hover:translate-x-2" />
        </button>
      </div>
    </div>
  );
}

const levelColors = {
  P1: "bg-tertiary-container/40 text-on-tertiary-container",
  P2: "bg-secondary-container/40 text-on-secondary-container",
  P3: "bg-primary-container/40 text-on-primary-container",
  P4: "bg-tertiary-container/40 text-on-tertiary-container",
  P5: "bg-primary-container/40 text-on-primary-container",
  P6: "bg-surface-variant text-on-surface",
};

const opGradients = {
  addition: "from-primary to-primary-container",
  soustraction: "from-tertiary to-tertiary-container",
  multiplication: "from-secondary to-secondary-container",
  division: "from-primary-dim to-primary",
};

const opTextColors = {
  addition: "text-primary",
  soustraction: "text-tertiary",
  multiplication: "text-secondary",
  division: "text-primary-dim",
};

function QuestionScreen({ question, index, total, onAnswer }) {
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const nextBtnRef = useRef(null);
  const gradient = opGradients[question.operation];

  useEffect(() => {
    if (feedback && nextBtnRef.current) {
      nextBtnRef.current.focus();
    }
  }, [feedback]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() === "" || feedback) return;
    const cleaned = input.replace(",", ".");
    const userAnswer = parseFloat(cleaned);
    if (isNaN(userAnswer)) return;
    const isCorrect = Math.abs(userAnswer - question.answer) < 0.001;
    setFeedback({ isCorrect, correctAnswer: question.answer });
  };

  const handleNext = () => {
    onAnswer(feedback.isCorrect);
  };

  const progressPercent = ((index + 1) / total) * 100;

  return (
    <div className="min-h-screen bg-background font-body text-on-surface flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background orbs */}
      <div className="bg-orb absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 opacity-50" />
      <div className="bg-orb absolute top-[60%] -right-[5%] w-[30%] h-[30%] bg-secondary-container/20 opacity-50" />

      {/* Progress bar */}
      <div className="w-full max-w-md mb-8 relative z-10">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-headline font-semibold text-on-surface-variant">
            Question {index + 1} / {total}
          </span>
          <span className={`text-xs font-headline font-bold px-3 py-1.5 rounded-full ${levelColors[question.level]} flex items-center gap-1.5`}>
            <Icon name={opIcons[question.operation]} className="text-sm" />
            {opLabels[question.operation]} — {question.level}
          </span>
        </div>
        <div className="w-full bg-surface-container rounded-full h-4 overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${gradient} rounded-full transition-all duration-500`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="bg-surface-container-lowest rounded-xl shadow-ambient p-8 md:p-12 w-full max-w-md text-center ghost-border relative z-10">
        {/* Operation icon */}
        <div className={`w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
          <Icon name={opIcons[question.operation]} fill className="text-2xl text-white" />
        </div>

        <div className="font-headline text-4xl md:text-5xl font-extrabold text-on-surface mb-8 tracking-tight">
          {question.text} = ?
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            inputMode="decimal"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!!feedback}
            autoFocus
            placeholder="Ta réponse..."
            className="w-full text-center font-headline text-3xl font-bold p-4 rounded-xl
              bg-surface-container-low text-on-surface
              border border-transparent
              focus:bg-surface-container-lowest focus:border-primary/15 focus:shadow-[0_0_0_3px_rgba(0,89,182,0.1)]
              outline-none transition-all duration-300
              disabled:opacity-60 placeholder:text-outline-variant"
          />

          {!feedback && (
            <button
              type="submit"
              className="gradient-soul text-on-primary font-headline font-bold text-xl w-full mt-5 py-4 rounded-xl
                shadow-[0_12px_24px_rgba(0,89,182,0.3)] spring-hover cursor-pointer flex items-center justify-center gap-2"
            >
              Valider
              <Icon name="check" />
            </button>
          )}
        </form>

        {feedback && (
          <div className="mt-6">
            {feedback.isCorrect ? (
              <div className="bg-tertiary-container/20 rounded-xl p-5">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-tertiary/10 flex items-center justify-center">
                  <Icon name="check_circle" fill className="text-5xl text-tertiary" />
                </div>
                <div className="text-2xl font-headline font-bold text-tertiary">Bravo !</div>
              </div>
            ) : (
              <div className="bg-error-container/10 rounded-xl p-5">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-error/10 flex items-center justify-center">
                  <Icon name="cancel" fill className="text-5xl text-error" />
                </div>
                <div className="text-2xl font-headline font-bold text-error mb-1">Pas tout à fait...</div>
                <div className="text-lg text-on-surface-variant">
                  La bonne réponse : <span className="font-bold text-error">{formatNumber(feedback.correctAnswer)}</span>
                </div>
              </div>
            )}

            {/* Explanation button */}
            {!feedback.isCorrect && !showExplanation && (
              <button
                onClick={() => setShowExplanation(true)}
                className="bg-secondary-container/30 hover:bg-secondary-container/50 text-on-secondary-container font-headline font-bold text-lg w-full mt-4 py-3 rounded-xl
                  transition-all duration-300 cursor-pointer flex items-center justify-center gap-2"
              >
                <Icon name="lightbulb" className="text-secondary" />
                Explication
              </button>
            )}

            {/* Detailed explanation */}
            {showExplanation && (
              <div className="mt-4 bg-surface-container-low rounded-xl p-5 text-left overflow-x-auto ghost-border">
                <p className="font-headline font-bold text-secondary mb-3 flex items-center gap-2">
                  <Icon name="lightbulb" fill className="text-secondary" />
                  Comment résoudre :
                </p>
                <pre className="text-on-surface-variant font-mono text-sm leading-relaxed whitespace-pre">
{generateExplanation(question)}
                </pre>
              </div>
            )}

            <button
              ref={nextBtnRef}
              onClick={handleNext}
              className="gradient-soul text-on-primary font-headline font-bold text-xl w-full mt-4 py-4 rounded-xl
                shadow-[0_12px_24px_rgba(0,89,182,0.3)] spring-hover cursor-pointer flex items-center justify-center gap-2"
            >
              {index + 1 < total ? (
                <>Suivante <Icon name="arrow_forward" /></>
              ) : (
                <>Voir mon diagnostic <Icon name="insights" /></>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function DiagnosticScreen({ analysis, onRestart }) {
  const { opAnalysis, estimatedLevel, strengths, weaknesses, totalCorrect, totalQuestions } = analysis;
  const percentage = Math.round((totalCorrect / totalQuestions) * 100);

  const levelDescriptions = {
    P1: "1ère primaire",
    P2: "2ème primaire",
    P3: "3ème primaire",
    P4: "4ème primaire",
    P5: "5ème primaire",
    P6: "6ème primaire",
  };

  return (
    <div className="min-h-screen bg-background font-body text-on-surface flex flex-col items-center p-6 py-10 relative overflow-hidden">
      {/* Background orbs */}
      <div className="bg-orb absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 opacity-50" />
      <div className="bg-orb absolute top-[60%] -right-[5%] w-[30%] h-[30%] bg-secondary-container/20 opacity-50" />

      <div className="w-full max-w-lg space-y-6 relative z-10">

        {/* Header + Score */}
        <section className="text-center mb-4">
          <h1 className="font-headline text-4xl md:text-5xl font-extrabold text-primary mb-3 tracking-tight">
            Ton diagnostic
          </h1>
          <p className="text-on-surface-variant text-lg">
            Analyse de tes résultats sur {totalQuestions} questions
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Score global card */}
          <div className="md:col-span-5 bg-gradient-to-br from-primary to-primary-dim rounded-xl p-6 text-on-primary shadow-lg flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-3 border border-white/30">
              <Icon name="stars" fill className="text-3xl" />
            </div>
            <h3 className="font-headline font-bold text-lg mb-1">Score Global</h3>
            <div className="text-5xl font-black tracking-tighter mb-1">{percentage}%</div>
            <p className="text-on-primary/80 text-sm">{totalCorrect}/{totalQuestions} bonnes réponses</p>
          </div>

          {/* Estimated level card */}
          <div className="md:col-span-7 bg-surface-container-lowest rounded-xl p-6 shadow-ambient-sm ghost-border flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-tertiary-container/30 flex items-center justify-center mb-3">
              <Icon name="school" fill className="text-2xl text-tertiary" />
            </div>
            <h3 className="font-headline font-bold text-lg text-on-surface mb-2">Niveau estimé</h3>
            <div className={`inline-block px-6 py-3 rounded-xl text-xl font-headline font-bold ${levelColors[estimatedLevel]}`}>
              {estimatedLevel} — {levelDescriptions[estimatedLevel]}
            </div>
          </div>
        </div>

        {/* Detail per operation */}
        <div className="bg-surface-container-lowest rounded-xl shadow-ambient-sm p-8 ghost-border">
          <h2 className="font-headline text-xl font-bold mb-6 flex items-center gap-2">
            <Icon name="analytics" className="text-primary" />
            Analyse de tes talents
          </h2>
          <div className="space-y-6">
            {OPERATIONS.map((op) => {
              const a = opAnalysis[op];
              const ratio = a.total > 0 ? a.score / a.total : 0;
              const barWidth = Math.round(ratio * 100);
              const gradient = opGradients[op];
              const color = opTextColors[op];

              return (
                <div key={op}>
                  <div className="flex justify-between items-end mb-2">
                    <span className="font-headline font-bold text-on-surface flex items-center gap-2">
                      <Icon name={opIcons[op]} className={`text-lg ${color}`} />
                      {opLabels[op]}
                    </span>
                    <div className="flex items-center gap-2">
                      {a.maxLevel && (
                        <span className={`text-xs font-headline font-bold px-2 py-1 rounded-full ${levelColors[a.maxLevel]}`}>
                          {a.maxLevel}
                        </span>
                      )}
                      <span className={`font-bold text-xl ${color}`}>
                        {barWidth}%
                      </span>
                    </div>
                  </div>
                  <div className="h-4 bg-surface-container rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${gradient} rounded-full transition-all duration-1000`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Strengths */}
        {strengths.length > 0 && (
          <div className="bg-tertiary-container/15 rounded-xl p-6 ghost-border">
            <h2 className="font-headline text-xl font-bold text-tertiary mb-4 flex items-center gap-2">
              <Icon name="military_tech" fill className="text-tertiary" />
              Tes points forts
            </h2>
            <div className="space-y-3">
              {strengths.map((op) => (
                <div key={op} className="flex items-center gap-3 text-on-surface">
                  <div className="w-10 h-10 rounded-full bg-tertiary-container/30 flex items-center justify-center">
                    <Icon name={opIcons[op]} fill className="text-tertiary" />
                  </div>
                  <span className="text-lg font-headline font-semibold">{opLabels[op]}</span>
                  <span className="text-sm text-on-surface-variant ml-auto font-headline">
                    Niveau {opAnalysis[op].maxLevel}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weaknesses */}
        {weaknesses.length > 0 && (
          <div className="bg-secondary-container/10 rounded-xl p-6 ghost-border">
            <h2 className="font-headline text-xl font-bold text-secondary mb-4 flex items-center gap-2">
              <Icon name="target" className="text-secondary" />
              À travailler
            </h2>
            <div className="space-y-3">
              {weaknesses.map((op) => {
                const a = opAnalysis[op];
                const tips = {
                  addition: "Entraîne-toi à poser des additions avec retenue",
                  soustraction: "Pratique les soustractions, surtout avec emprunt",
                  multiplication: "Révise tes tables de multiplication régulièrement",
                  division: "Commence par des divisions simples et augmente petit à petit",
                };
                return (
                  <div key={op} className="bg-surface-container-lowest rounded-xl p-4 ghost-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary-container/20 flex items-center justify-center">
                        <Icon name={opIcons[op]} className="text-secondary" />
                      </div>
                      <span className="font-headline font-semibold text-on-surface">{opLabels[op]}</span>
                      <span className="text-sm text-on-surface-variant ml-auto">
                        {a.score}/{a.total}
                      </span>
                    </div>
                    <p className="text-sm text-on-surface-variant mt-2 ml-13 flex items-start gap-2">
                      <Icon name="lightbulb" className="text-secondary text-sm mt-0.5" />
                      {tips[op]}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Mentor message */}
        <div className="bg-surface-container-lowest rounded-xl shadow-ambient-sm p-6 ghost-border text-center">
          <h3 className="font-headline font-bold text-lg mb-3">Résumé du Mentor</h3>
          <p className="text-on-surface-variant italic text-sm leading-relaxed">
            {percentage >= 70
              ? "Beau travail ! Tes compétences sont solides. Continue sur cette lancée pour atteindre le sommet !"
              : percentage >= 40
                ? "C'est un bon début ! En t'entraînant régulièrement, tu vas progresser très vite. Concentre-toi sur tes points faibles."
                : "Chaque exercice te fait progresser. Ne lâche pas ! Reprends les bases et tu verras la différence."}
          </p>
        </div>

        {/* Restart button */}
        <button
          onClick={onRestart}
          className="gradient-soul text-on-primary font-headline font-bold text-xl w-full py-5 rounded-xl
            shadow-[0_12px_24px_rgba(0,89,182,0.3)] spring-hover cursor-pointer flex items-center justify-center gap-3"
        >
          <Icon name="replay" />
          Refaire le test
        </button>
      </div>
    </div>
  );
}

// --- App principale (test adaptatif) ---

export default function App() {
  const [screen, setScreen] = useState("welcome");
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState([]);
  const [currentLevels, setCurrentLevels] = useState({ ...opStartLevel });
  const [analysis, setAnalysis] = useState(null);

  // Génère la prochaine question de manière adaptative
  const generateNextQuestion = (levels, questionIndex) => {
    // Round-robin sur les opérations : 5 par opération
    const opIndex = questionIndex % OPERATIONS.length;
    const op = OPERATIONS[opIndex];
    const level = levels[op];
    const gen = generators[op][level];
    if (!gen) {
      // Fallback : prend le niveau le plus haut disponible
      const available = Object.keys(generators[op]);
      const fallbackGen = generators[op][available[available.length - 1]];
      const q = fallbackGen();
      return { ...q, operation: op, level: available[available.length - 1] };
    }
    const q = gen();
    return { ...q, operation: op, level };
  };

  const startTest = () => {
    const initLevels = { ...opStartLevel };
    setCurrentLevels(initLevels);
    setResults([]);
    setCurrentIndex(0);
    // Générer la première question
    const firstQ = generateNextQuestion(initLevels, 0);
    setQuestions([firstQ]);
    setScreen("quiz");
  };

  const handleAnswer = (isCorrect) => {
    const currentQ = questions[currentIndex];
    const newResult = { operation: currentQ.operation, level: currentQ.level, correct: isCorrect };
    const newResults = [...results, newResult];
    setResults(newResults);

    const nextIndex = currentIndex + 1;

    if (nextIndex >= 20) {
      // Fin du test
      const a = analyzeResults(newResults);
      setAnalysis(a);
      setScreen("diagnostic");
      return;
    }

    // Adapter le niveau pour cette opération
    const newLevels = { ...currentLevels };
    const op = currentQ.operation;
    newLevels[op] = getNextLevel(currentLevels[op], isCorrect, op);
    setCurrentLevels(newLevels);

    // Générer la question suivante
    const nextQ = generateNextQuestion(newLevels, nextIndex);
    setQuestions((prev) => [...prev, nextQ]);
    setCurrentIndex(nextIndex);
  };

  if (screen === "welcome") {
    return <WelcomeScreen onStart={startTest} />;
  }

  if (screen === "quiz" && questions[currentIndex]) {
    return (
      <QuestionScreen
        key={currentIndex}
        question={questions[currentIndex]}
        index={currentIndex}
        total={20}
        onAnswer={handleAnswer}
      />
    );
  }

  if (screen === "diagnostic" && analysis) {
    return <DiagnosticScreen analysis={analysis} onRestart={startTest} />;
  }

  return null;
}
