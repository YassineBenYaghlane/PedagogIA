import { useEffect, useState } from "react"
import { Link } from "react-router"
import { api } from "../../api/client"
import ExerciseCard from "../exercises/ExerciseCard"

export default function DebugInputsScreen() {
  const [samples, setSamples] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitted, setSubmitted] = useState({})

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.get("/exercises/samples/")
      setSamples(data || [])
      setSubmitted({})
    } catch (err) {
      setError(err.message || "Erreur")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const onSubmit = (idx, sample) => (answer) => {
    const { ok, expected } = checkAnswer(sample, answer)
    setSubmitted((s) => ({ ...s, [idx]: { answer, expected, ok } }))
  }

  return (
    <div className="min-h-screen bg-chalk p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-headline text-3xl font-extrabold text-on-surface">
            Debug — Types d'exercices
          </h1>
          <div className="flex gap-3">
            <button
              onClick={load}
              className="px-4 py-2 rounded-lg bg-surface-container-low text-on-surface font-headline cursor-pointer spring-hover"
            >
              Régénérer
            </button>
            <Link
              to="/"
              className="px-4 py-2 rounded-lg bg-surface-container-low text-on-surface font-headline cursor-pointer spring-hover"
            >
              Retour
            </Link>
          </div>
        </div>

        {loading && <p className="text-center text-on-surface-variant">Chargement…</p>}
        {error && <p className="text-center text-error">Erreur : {error}</p>}

        <div className="grid gap-6">
          {samples.map((s, i) => (
            <section key={`${s.input_type}-${i}`} className="flex flex-col items-center gap-2">
              <div className="font-headline text-xs uppercase tracking-wide text-on-surface-variant">
                {s.input_type} · {s.skill_id} · difficulty {s.difficulty}
              </div>
              <ExerciseCard
                exercise={s}
                skill={{ id: s.skill_id, label: s.skill_id, grade: "P?" }}
                grade="P3"
                feedback={null}
                busy={false}
                onSubmit={onSubmit(i, s)}
                onNext={() => {}}
              />
              {submitted[i] && (
                <div
                  className={`mt-2 px-4 py-2 rounded-lg font-headline ${
                    submitted[i].ok ? "bg-primary/10 text-primary" : "bg-error/10 text-error"
                  }`}
                >
                  Ta réponse : <b>{String(submitted[i].answer)}</b> · attendue :{" "}
                  <b>{JSON.stringify(submitted[i].expected)}</b> ·{" "}
                  {submitted[i].ok ? "✓ correct" : "✗ différent"}
                </div>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}

function checkAnswer(sample, raw) {
  const t = sample.input_type
  if (t === "decomposition") {
    const expected = sample.params?.parts || {}
    let submitted = {}
    try { submitted = JSON.parse(raw) } catch { /* ignore */ }
    const ok = Object.keys(expected).every(
      (k) => Number(expected[k]) === Number(submitted?.[k] ?? 0),
    )
    return { ok, expected }
  }
  if (t === "drag_order") {
    const expected = sample.params?.correct_order || sample.answer
    let submitted = []
    try { submitted = JSON.parse(raw) } catch { /* ignore */ }
    const ok = JSON.stringify(expected) === JSON.stringify(submitted)
    return { ok, expected }
  }
  if (t === "point_on_line" || t === "number") {
    const expected = sample.answer
    const norm = (v) => String(v).trim().replace(",", ".")
    return { ok: norm(expected) === norm(raw), expected }
  }
  return { ok: String(sample.answer) === String(raw), expected: sample.answer }
}
