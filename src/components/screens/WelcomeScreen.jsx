import Icon from "../ui/Icon"

export default function WelcomeScreen({ onStart }) {
  return (
    <div className="min-h-screen bg-background font-body text-on-surface flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="bg-orb absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 opacity-50" />
      <div className="bg-orb absolute top-[60%] -right-[5%] w-[30%] h-[30%] bg-secondary-container/20 opacity-50" />

      <div className="bg-surface-container-lowest rounded-xl shadow-ambient p-8 md:p-12 max-w-lg w-full text-center ghost-border relative z-10">
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
  )
}
