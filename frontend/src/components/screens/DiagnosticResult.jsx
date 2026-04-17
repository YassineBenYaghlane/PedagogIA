import { useEffect, useMemo, useState } from "react"
import Icon from "../ui/Icon"
import Button from "../ui/Button"
import Card from "../ui/Card"
import { Heading, LatinLabel } from "../ui/Heading"

const BUCKET_STYLES = {
  green: { ring: "stroke-sage", fill: "bg-sage", text: "text-sage-deep", soft: "bg-sage-leaf/40", label: "En croissance" },
  orange: { ring: "stroke-honey", fill: "bg-honey", text: "text-honey", soft: "bg-honey/15", label: "À arroser" },
  red: { ring: "stroke-rose", fill: "bg-rose", text: "text-rose", soft: "bg-rose/15", label: "Graine" },
}

const LEVEL_COPY = {
  P1: "1ʳᵉ primaire",
  P2: "2ᵉ primaire",
  P3: "3ᵉ primaire",
  P4: "4ᵉ primaire",
  P5: "5ᵉ primaire",
  P6: "6ᵉ primaire",
}

function useMounted(delay = 0) {
  const [on, setOn] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setOn(true), delay)
    return () => clearTimeout(t)
  }, [delay])
  return on
}

function useCountUp(target, { duration = 900, delay = 0 } = {}) {
  const [v, setV] = useState(0)
  useEffect(() => {
    if (target == null) return
    let raf
    const start = performance.now() + delay
    const tick = (now) => {
      const elapsed = Math.max(0, now - start)
      const t = Math.min(1, elapsed / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setV(Math.round(target * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration, delay])
  return v
}

function VerdictHero({ verdict, child, overallPct, totalCorrect, totalAttempts }) {
  const mounted = useMounted(60)
  const confidencePct = Math.round((verdict?.confidence ?? 0) * 100)
  const confAnim = useCountUp(confidencePct, { duration: 1100, delay: 280 })
  const overallAnim = useCountUp(overallPct, { duration: 1100, delay: 420 })
  const correctAnim = useCountUp(totalCorrect, { duration: 900, delay: 420 })

  const hasLevel = !!verdict?.level
  const circumference = 2 * Math.PI * 54
  const ringOffset = circumference * (1 - confAnim / 100)

  return (
    <div
      data-testid="diagnostic-verdict"
      className={`relative mb-8 rounded-3xl border border-sage/20 bg-gradient-to-br from-sage-leaf/30 via-bone to-mist/60 p-6 md:p-8 overflow-hidden ${
        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      } transition-all duration-700 ease-out`}
    >
      <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-sage-leaf/30 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-56 h-56 rounded-full bg-sky/20 blur-3xl pointer-events-none" />

      <div className="relative flex flex-col md:flex-row items-center gap-6">
        <div className="relative shrink-0">
          <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
            <circle
              cx="70" cy="70" r="54"
              className="fill-none stroke-mist"
              strokeWidth="10"
            />
            <circle
              cx="70" cy="70" r="54"
              className="fill-none stroke-sage-deep transition-all duration-1000 ease-out"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={ringOffset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="font-display font-semibold text-5xl text-bark tabular-nums leading-none">
              {hasLevel ? verdict.level : "—"}
            </div>
            {hasLevel && (
              <div className="mt-1 text-[10px] uppercase tracking-widest text-stem">
                niveau FWB
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0 text-center md:text-left">
          <LatinLabel>Locus inventus</LatinLabel>
          <Heading level={2} className="mt-1">
            {child?.display_name}
          </Heading>
          {hasLevel ? (
            <p className="mt-2 text-bark/80">
              <span className="font-semibold">{LEVEL_COPY[verdict.level]}</span>
              <span className="text-stem"> · confiance </span>
              <span className="font-mono tabular-nums">{confAnim}%</span>
            </p>
          ) : (
            <p className="mt-2 text-stem">Niveau non établi — refaites le diagnostic pour affiner.</p>
          )}
          {verdict?.narrative && (
            <p className="mt-3 text-sm text-bark/75 leading-relaxed">{verdict.narrative}</p>
          )}
          <div className="mt-4 flex items-center gap-4 justify-center md:justify-start text-sm text-stem font-mono">
            <div>
              <span className="text-bark font-semibold tabular-nums">{correctAnim}</span>
              <span className="mx-1">/</span>
              <span className="tabular-nums">{totalAttempts}</span>
              <span className="ml-1">réussies</span>
            </div>
            <span className="h-4 w-px bg-sage/30" />
            <div>
              <span className="text-bark font-semibold tabular-nums">{overallAnim}%</span>
              <span className="ml-1">de réussite</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CountCard({ tone, label, value, delay }) {
  const style = BUCKET_STYLES[tone]
  const anim = useCountUp(value, { duration: 800, delay })
  return (
    <Card className={`p-4 text-center border-sage/10 ${style.soft} transition-shadow duration-300 hover:shadow-md`}>
      <div className={`font-mono text-3xl font-semibold ${style.text} tabular-nums`}>{anim}</div>
      <div className="text-[11px] uppercase tracking-wider text-stem mt-1">{label}</div>
    </Card>
  )
}

function YearRow({ entry, index }) {
  const style = BUCKET_STYLES[entry.bucket] || BUCKET_STYLES.orange
  const pct = Math.round(entry.rate * 100)
  const anim = useCountUp(pct, { duration: 900, delay: 260 + index * 120 })
  const mounted = useMounted(160 + index * 120)
  return (
    <div
      className={`py-3 border-b border-sage/10 last:border-0 transition-all duration-500 ease-out ${
        mounted ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
      }`}
    >
      <div className="flex items-center justify-between mb-2 text-sm">
        <div className="flex items-center gap-3">
          <span className="font-display font-semibold text-bark w-8">{entry.grade}</span>
          <span className={`text-[11px] uppercase tracking-wider font-semibold ${style.text}`}>
            {style.label}
          </span>
        </div>
        <div className="text-stem font-mono tabular-nums">
          <span className="text-bark font-semibold">{entry.correct}</span>
          <span className="mx-1">/</span>
          <span>{entry.n}</span>
          <span className="ml-2 opacity-70">d{entry.max_difficulty}</span>
        </div>
      </div>
      <div className="relative h-2.5 rounded-full bg-mist overflow-hidden">
        <div
          className={`h-full ${style.fill} transition-all duration-1000 ease-out`}
          style={{ width: `${anim}%` }}
        />
      </div>
    </div>
  )
}

function SkillRow({ skill, index }) {
  const style = BUCKET_STYLES[skill.bucket]
  const mounted = useMounted(100 + index * 40)
  return (
    <div
      className={`flex items-center justify-between py-2 border-b border-sage/10 last:border-0 transition-opacity duration-500 ${
        mounted ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className={`h-2.5 w-2.5 rounded-full ${style.fill} flex-shrink-0`} />
        <div className="min-w-0">
          <p className="font-display font-semibold text-bark truncate">{skill.label}</p>
          <p className="text-xs text-stem font-mono">
            {skill.grade} · {skill.correct}/{skill.total}
          </p>
        </div>
      </div>
      <span className={`text-xs font-semibold uppercase tracking-wider ${style.text} flex-shrink-0 ml-3`}>
        {style.label}
      </span>
    </div>
  )
}

function groupByGrade(skills) {
  const groups = {}
  for (const s of skills) {
    const key = s.grade || "autre"
    if (!groups[key]) groups[key] = []
    groups[key].push(s)
  }
  return groups
}

export default function DiagnosticResult({ result, child, onBack }) {
  const years = result.years || []
  const verdict = result.verdict
  const groups = useMemo(() => groupByGrade(result.skills), [result.skills])
  const counts = result.skills.reduce(
    (acc, s) => ({ ...acc, [s.bucket]: (acc[s.bucket] || 0) + 1 }),
    { green: 0, orange: 0, red: 0 }
  )
  const overallPct = Math.round((result.overall_rate || 0) * 100)
  const contentMounted = useMounted(200)

  return (
    <div className="min-h-screen greenhouse flex flex-col items-center p-6">
      <Card className="p-6 md:p-10 max-w-2xl w-full my-8">
        <VerdictHero
          verdict={verdict}
          child={child}
          overallPct={overallPct}
          totalCorrect={result.total_correct}
          totalAttempts={result.total_attempts}
        />

        <div
          className={`grid grid-cols-3 gap-3 mb-8 transition-all duration-500 delay-200 ${
            contentMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
          }`}
          data-testid="diagnostic-counts"
        >
          <CountCard tone="green" label="En croissance" value={counts.green} delay={520} />
          <CountCard tone="orange" label="À arroser" value={counts.orange} delay={620} />
          <CountCard tone="red" label="Graines" value={counts.red} delay={720} />
        </div>

        {years.length > 0 && (
          <div className="mb-8" data-testid="diagnostic-years">
            <Heading level={4} className="mb-3">Maîtrise par année</Heading>
            <Card className="p-4">
              {years.map((y, i) => <YearRow key={y.grade} entry={y} index={i} />)}
            </Card>
          </div>
        )}

        {result.strengths?.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="star" fill className="text-sage-deep" />
              <Heading level={4}>Points forts</Heading>
            </div>
            <ul className="text-sm text-bark space-y-1 pl-6">
              {result.strengths.map((s) => <li key={s.skill_id}>• {s.label}</li>)}
            </ul>
          </div>
        )}

        {result.weaknesses?.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="target" className="text-sky-deep" />
              <Heading level={4}>À arroser</Heading>
            </div>
            <ul className="text-sm text-bark space-y-1 pl-6">
              {result.weaknesses.map((s) => <li key={s.skill_id}>• {s.label}</li>)}
            </ul>
          </div>
        )}

        <div className="space-y-5 mb-8" data-testid="diagnostic-skills">
          <Heading level={4}>Détail par compétence</Heading>
          {Object.entries(groups).map(([grade, skills]) => (
            <div key={grade}>
              <div className="text-[11px] uppercase tracking-wider text-stem mb-2">{grade}</div>
              <Card className="px-4">
                {skills.map((s, i) => <SkillRow key={s.skill_id} skill={s} index={i} />)}
              </Card>
            </div>
          ))}
        </div>

        <Button onClick={onBack} size="lg" className="w-full" data-testid="diagnostic-done">
          <Icon name="home" /> Retour à la serre
        </Button>
      </Card>
    </div>
  )
}
