import Icon from "../ui/Icon"
import {
  OPERATIONS, opLabels, opIcons, opGradients, opTextColors,
  levelColors, levelDescriptions
} from "../../lib/constants"

export default function DiagnosticScreen({ analysis, onRestart }) {
  const { opAnalysis, estimatedLevel, strengths, weaknesses, totalCorrect, totalQuestions } = analysis
  const percentage = Math.round((totalCorrect / totalQuestions) * 100)

  return (
    <div className="min-h-screen bg-background font-body text-on-surface flex flex-col items-center p-6 py-10 relative overflow-hidden">
      <div className="bg-orb absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 opacity-50" />
      <div className="bg-orb absolute top-[60%] -right-[5%] w-[30%] h-[30%] bg-secondary-container/20 opacity-50" />

      <div className="w-full max-w-lg space-y-6 relative z-10">

        <section className="text-center mb-4">
          <h1 className="font-headline text-4xl md:text-5xl font-extrabold text-primary mb-3 tracking-tight">
            Ton diagnostic
          </h1>
          <p className="text-on-surface-variant text-lg">
            Analyse de tes résultats sur {totalQuestions} questions
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-5 bg-gradient-to-br from-primary to-primary-dim rounded-xl p-6 text-on-primary shadow-lg flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-3 border border-white/30">
              <Icon name="stars" fill className="text-3xl" />
            </div>
            <h3 className="font-headline font-bold text-lg mb-1">Score Global</h3>
            <div className="text-5xl font-black tracking-tighter mb-1">{percentage}%</div>
            <p className="text-on-primary/80 text-sm">{totalCorrect}/{totalQuestions} bonnes réponses</p>
          </div>

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

        <div className="bg-surface-container-lowest rounded-xl shadow-ambient-sm p-8 ghost-border">
          <h2 className="font-headline text-xl font-bold mb-6 flex items-center gap-2">
            <Icon name="analytics" className="text-primary" />
            Analyse de tes talents
          </h2>
          <div className="space-y-6">
            {OPERATIONS.map((op) => {
              const a = opAnalysis[op]
              const ratio = a.total > 0 ? a.score / a.total : 0
              const barWidth = Math.round(ratio * 100)
              const gradient = opGradients[op]
              const color = opTextColors[op]

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
              )
            })}
          </div>
        </div>

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

        {weaknesses.length > 0 && (
          <div className="bg-secondary-container/10 rounded-xl p-6 ghost-border">
            <h2 className="font-headline text-xl font-bold text-secondary mb-4 flex items-center gap-2">
              <Icon name="target" className="text-secondary" />
              À travailler
            </h2>
            <div className="space-y-3">
              {weaknesses.map((op) => {
                const a = opAnalysis[op]
                const tips = {
                  addition: "Entraîne-toi à poser des additions avec retenue",
                  soustraction: "Pratique les soustractions, surtout avec emprunt",
                  multiplication: "Révise tes tables de multiplication régulièrement",
                  division: "Commence par des divisions simples et augmente petit à petit"
                }
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
                )
              })}
            </div>
          </div>
        )}

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
  )
}
