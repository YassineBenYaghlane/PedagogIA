import { useEffect, useState } from "react"
import AppShell from "../layout/AppShell"
import Page from "../layout/Page"
import TopBar from "../layout/TopBar"
import { TopBarBack, TopBarButton } from "../layout/TopBarActions"
import { api } from "../../api/client"
import Loader from "../ui/Loader"
import ExerciseCard from "../exercises/ExerciseCard"
import { localValidate } from "../../lib/localValidate"

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
    const { ok, expected } = localValidate(sample, answer)
    setSubmitted((s) => ({ ...s, [idx]: { answer, expected, ok } }))
  }

  return (
    <AppShell
      surface="plain"
      topBar={
        <TopBar
          leading={<TopBarBack to="/atelier" label="Atelier" />}
          title="Types d'exercices"
          trailing={<TopBarButton onClick={load} icon="refresh">Régénérer</TopBarButton>}
        />
      }
    >
      <Page maxWidth="xl">

        {loading && (
          <div className="py-10">
            <Loader message="Chargement…" />
          </div>
        )}
        {error && <p className="text-center text-rose">Erreur : {error}</p>}

        <div className="grid gap-6">
          {samples.map((s, i) => (
            <section key={`${s.input_type}-${i}`} className="flex flex-col items-center gap-2">
              <div className="text-xs uppercase tracking-wide text-stem">
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
                  className={`mt-2 px-4 py-2 rounded-lg font-display ${
                    submitted[i].ok
                      ? "bg-sage-pale/40 text-sage-deep"
                      : "bg-rose-soft text-rose"
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
      </Page>
    </AppShell>
  )
}

