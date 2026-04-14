import Icon from "../ui/Icon"

const BUCKET_STYLES = {
  green: {
    dot: "bg-tertiary",
    text: "text-tertiary",
    label: "Maîtrisé"
  },
  orange: {
    dot: "bg-secondary",
    text: "text-secondary",
    label: "En cours"
  },
  red: {
    dot: "bg-error",
    text: "text-error",
    label: "À travailler"
  }
}

function SkillRow({ skill }) {
  const style = BUCKET_STYLES[skill.bucket]
  return (
    <div className="flex items-center justify-between py-2 border-b border-outline-variant/30 last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <span className={`h-3 w-3 rounded-full ${style.dot} flex-shrink-0`} />
        <div className="min-w-0">
          <p className="font-headline font-semibold text-on-surface truncate">{skill.label}</p>
          <p className="text-xs text-on-surface-variant">
            {skill.grade} · {skill.correct}/{skill.total}
          </p>
        </div>
      </div>
      <span className={`text-xs font-headline font-bold ${style.text} flex-shrink-0 ml-3`}>
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
      <div className="flex items-center gap-3 min-w-0">
        <span className="font-headline font-bold text-on-surface w-8">{entry.grade}</span>
        <div className="flex-1 h-2 rounded-full bg-surface-container overflow-hidden min-w-[60px]">
          <div
            className={`h-full transition-all duration-500 ${style.dot}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <div className="flex items-center gap-3 ml-3 flex-shrink-0 text-sm">
        <span className="text-on-surface-variant">{entry.correct}/{entry.total_attempts}</span>
        <span className={`font-headline font-bold ${style.text} w-10 text-right`}>{pct}%</span>
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

  return (
    <div className="min-h-screen bg-background font-body text-on-surface flex flex-col items-center p-6 relative overflow-hidden">
      <div className="bg-orb absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 opacity-50" />
      <div className="bg-orb absolute top-[60%] -right-[5%] w-[30%] h-[30%] bg-secondary-container/20 opacity-50" />

      <div className="bg-surface-container-lowest rounded-xl shadow-ambient p-8 md:p-10 max-w-2xl w-full ghost-border relative z-10 my-8">
        <div className="text-center mb-6">
          <p className="text-sm uppercase tracking-wide text-on-surface-variant">Diagnostic terminé</p>
          <h1 className="font-headline text-3xl md:text-4xl font-extrabold text-primary tracking-tight">
            {child?.display_name}
          </h1>
          <p className="text-on-surface-variant mt-1">
            {result.total_correct}/{result.total_attempts} réussies · {Math.round((result.overall_rate || 0) * 100)}%
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-8" data-testid="diagnostic-counts">
          <div className="bg-surface-container-low rounded-xl p-4 text-center">
            <div className="text-3xl font-headline font-extrabold text-tertiary">{counts.green}</div>
            <div className="text-xs uppercase tracking-wide text-on-surface-variant mt-1">Maîtrisé</div>
          </div>
          <div className="bg-surface-container-low rounded-xl p-4 text-center">
            <div className="text-3xl font-headline font-extrabold text-secondary">{counts.orange}</div>
            <div className="text-xs uppercase tracking-wide text-on-surface-variant mt-1">En cours</div>
          </div>
          <div className="bg-surface-container-low rounded-xl p-4 text-center">
            <div className="text-3xl font-headline font-extrabold text-error">{counts.red}</div>
            <div className="text-xs uppercase tracking-wide text-on-surface-variant mt-1">À travailler</div>
          </div>
        </div>

        {result.strengths?.length > 0 && (
          <div className="mb-6">
            <h2 className="font-headline font-bold text-tertiary mb-2 flex items-center gap-2">
              <Icon name="star" fill /> Points forts
            </h2>
            <ul className="text-sm text-on-surface space-y-1">
              {result.strengths.map((s) => (
                <li key={s.skill_id}>• {s.label}</li>
              ))}
            </ul>
          </div>
        )}

        {result.weaknesses?.length > 0 && (
          <div className="mb-6">
            <h2 className="font-headline font-bold text-error mb-2 flex items-center gap-2">
              <Icon name="target" /> À travailler
            </h2>
            <ul className="text-sm text-on-surface space-y-1">
              {result.weaknesses.map((s) => (
                <li key={s.skill_id}>• {s.label}</li>
              ))}
            </ul>
          </div>
        )}

        {grades.length > 0 && (
          <div className="mb-8" data-testid="diagnostic-grades">
            <h2 className="font-headline font-bold text-on-surface mb-3">Niveau par année</h2>
            <div className="bg-surface-container-low rounded-xl p-4 space-y-1">
              {grades.map((g) => (
                <GradeSummaryRow key={g.grade} entry={g} />
              ))}
            </div>
          </div>
        )}

        <div className="space-y-5 mb-8" data-testid="diagnostic-skills">
          <h2 className="font-headline font-bold text-on-surface mb-1">Détail par compétence</h2>
          {Object.entries(groups).map(([grade, skills]) => (
            <div key={grade}>
              <h3 className="font-headline font-bold text-on-surface-variant uppercase text-xs tracking-wide mb-2">
                {grade}
              </h3>
              <div className="bg-surface-container-low rounded-xl px-4">
                {skills.map((s) => (
                  <SkillRow key={s.skill_id} skill={s} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onBack}
          className="gradient-soul text-on-primary font-headline font-bold text-xl w-full py-4 rounded-xl shadow-[0_12px_24px_rgba(0,89,182,0.3)] spring-hover cursor-pointer flex items-center justify-center gap-3"
          data-testid="diagnostic-done"
        >
          <Icon name="home" /> Retour à l'accueil
        </button>
      </div>
    </div>
  )
}
