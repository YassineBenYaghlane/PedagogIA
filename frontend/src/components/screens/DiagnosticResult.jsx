import Icon from "../ui/Icon"
import Button from "../ui/Button"
import Card from "../ui/Card"
import { Heading, LatinLabel } from "../ui/Heading"
import ProgressBar from "../ui/ProgressBar"

const BUCKET_STYLES = {
  green: { dot: "bg-sage", text: "text-sage-deep", tone: "sage", label: "En croissance" },
  orange: { dot: "bg-honey", text: "text-honey", tone: "honey", label: "À arroser" },
  red: { dot: "bg-rose", text: "text-rose", tone: "rose", label: "Graine" },
}

function SkillRow({ skill }) {
  const style = BUCKET_STYLES[skill.bucket]
  return (
    <div className="flex items-center justify-between py-2 border-b border-sage/10 last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <span className={`h-2.5 w-2.5 rounded-full ${style.dot} flex-shrink-0`} />
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

function GradeSummaryRow({ entry }) {
  const style = BUCKET_STYLES[entry.bucket]
  const pct = Math.round((entry.rate || 0) * 100)
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span className="font-display font-semibold text-bark w-8">{entry.grade}</span>
        <ProgressBar value={pct} max={100} tone={style.tone} className="flex-1" />
      </div>
      <div className="flex items-center gap-3 ml-3 flex-shrink-0 text-sm">
        <span className="text-stem font-mono">{entry.correct}/{entry.total_attempts}</span>
        <span className={`font-mono font-semibold ${style.text} w-10 text-right tabular-nums`}>{pct}%</span>
      </div>
    </div>
  )
}

export default function DiagnosticResult({ result, child, onBack }) {
  const groups = groupByGrade(result.skills)
  const grades = result.grades || []
  const counts = result.skills.reduce(
    (acc, s) => ({ ...acc, [s.bucket]: (acc[s.bucket] || 0) + 1 }),
    { green: 0, orange: 0, red: 0 }
  )
  const overallPct = Math.round((result.overall_rate || 0) * 100)

  return (
    <div className="min-h-screen greenhouse flex flex-col items-center p-6">
      <Card className="p-8 md:p-10 max-w-2xl w-full my-8">
        <div className="text-center mb-6">
          <LatinLabel>Locus inventus</LatinLabel>
          <Heading level={2} className="mt-1">
            {child?.display_name}
          </Heading>
          <p className="text-stem mt-2 font-mono tabular-nums">
            {result.total_correct}/{result.total_attempts} réussies · {overallPct}%
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-8" data-testid="diagnostic-counts">
          <Card className="p-4 text-center">
            <div className="font-mono text-3xl font-semibold text-sage-deep">{counts.green}</div>
            <div className="text-[11px] uppercase tracking-wider text-stem mt-1">En croissance</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="font-mono text-3xl font-semibold text-honey">{counts.orange}</div>
            <div className="text-[11px] uppercase tracking-wider text-stem mt-1">À arroser</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="font-mono text-3xl font-semibold text-rose">{counts.red}</div>
            <div className="text-[11px] uppercase tracking-wider text-stem mt-1">Graines</div>
          </Card>
        </div>

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

        {grades.length > 0 && (
          <div className="mb-8" data-testid="diagnostic-grades">
            <Heading level={4} className="mb-3">Niveau par année</Heading>
            <Card className="p-4 space-y-1">
              {grades.map((g) => <GradeSummaryRow key={g.grade} entry={g} />)}
            </Card>
          </div>
        )}

        <div className="space-y-5 mb-8" data-testid="diagnostic-skills">
          <Heading level={4}>Détail par compétence</Heading>
          {Object.entries(groups).map(([grade, skills]) => (
            <div key={grade}>
              <div className="text-[11px] uppercase tracking-wider text-stem mb-2">{grade}</div>
              <Card className="px-4">
                {skills.map((s) => <SkillRow key={s.skill_id} skill={s} />)}
              </Card>
            </div>
          ))}
        </div>

        <Button
          onClick={onBack}
          size="lg"
          className="w-full"
          data-testid="diagnostic-done"
        >
          <Icon name="home" /> Retour à la serre
        </Button>
      </Card>
    </div>
  )
}
