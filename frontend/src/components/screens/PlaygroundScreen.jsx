import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router"
import AppShell from "../layout/AppShell"
import Page from "../layout/Page"
import Input from "../ui/Input"
import Button from "../ui/Button"
import Card from "../ui/Card"
import Loader from "../ui/Loader"
import ExerciseCard from "../exercises/ExerciseCard"
import { playgroundApi } from "../../api/playground"

const GRADES = ["P1", "P2", "P3", "P4", "P5", "P6"]
const INPUT_TYPES = ["number", "mcq", "symbol", "decomposition", "point_on_line", "drag_order"]
const DIFFICULTIES = [1, 2, 3]

function checkAnswer(exercise, raw) {
  const t = exercise.input_type
  if (t === "decomposition") {
    const expected = exercise.params?.parts || {}
    let submitted = {}
    try { submitted = JSON.parse(raw) } catch { /* ignore */ }
    const ok = Object.keys(expected).every(
      (k) => Number(expected[k]) === Number(submitted?.[k] ?? 0),
    )
    return { ok, expected }
  }
  if (t === "drag_order") {
    const expected = exercise.params?.correct_order || exercise.answer
    let submitted = []
    try { submitted = JSON.parse(raw) } catch { /* ignore */ }
    const ok = JSON.stringify(expected) === JSON.stringify(submitted)
    return { ok, expected }
  }
  if (t === "point_on_line" || t === "number") {
    const norm = (v) => String(v).trim().replace(",", ".")
    return { ok: norm(exercise.answer) === norm(raw), expected: exercise.answer }
  }
  return { ok: String(exercise.answer) === String(raw), expected: exercise.answer }
}

function TemplateRow({ template, selected, onClick }) {
  const grade = template.grades?.[0] || "—"
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "w-full text-left px-3 py-2 rounded-lg border transition-colors " +
        (selected
          ? "border-sage bg-sage-leaf/30 text-bark"
          : "border-bark/10 bg-paper hover:border-sage/60 text-stem hover:text-bark")
      }
    >
      <div className="font-mono text-xs break-all">{template.id}</div>
      <div className="mt-1 flex gap-1.5 flex-wrap text-[10px] uppercase tracking-wider">
        <span className="chip">{grade}</span>
        <span className="chip">diff {template.difficulty}</span>
        <span className="chip">{template.input_type}</span>
      </div>
    </button>
  )
}

function Filters({ filters, setFilter, search, setSearch, skills, total, shown }) {
  return (
    <div className="flex flex-col gap-2">
      <Input
        placeholder="Chercher (id, skill)…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="grid grid-cols-3 gap-2">
        <Input as="select" value={filters.grade} onChange={(e) => setFilter("grade", e.target.value)}>
          <option value="">Toutes classes</option>
          {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
        </Input>
        <Input
          as="select"
          value={filters.inputType}
          onChange={(e) => setFilter("inputType", e.target.value)}
        >
          <option value="">Tous inputs</option>
          {INPUT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </Input>
        <Input
          as="select"
          value={filters.difficulty}
          onChange={(e) => setFilter("difficulty", e.target.value)}
        >
          <option value="">Toute difficulté</option>
          {DIFFICULTIES.map((d) => <option key={d} value={d}>{`diff ${d}`}</option>)}
        </Input>
      </div>
      <Input
        as="select"
        value={filters.skillId}
        onChange={(e) => setFilter("skillId", e.target.value)}
      >
        <option value="">Toutes compétences ({skills.length})</option>
        {skills.map((s) => <option key={s} value={s}>{s}</option>)}
      </Input>
      <div className="text-xs text-stem">{shown} / {total} templates</div>
    </div>
  )
}

function Detail({ template, instance, overrideText, setOverrideText, onRegenerate, loading, error }) {
  const [submitted, setSubmitted] = useState(null)
  const [lastInstance, setLastInstance] = useState(instance)
  if (instance !== lastInstance) {
    setLastInstance(instance)
    setSubmitted(null)
  }

  if (!template) {
    return (
      <Card variant="paper" className="p-10 text-center text-stem">
        Sélectionne un template à gauche.
      </Card>
    )
  }

  const onSubmit = (raw) => setSubmitted({ ...checkAnswer(instance, raw), answer: raw })

  return (
    <div className="flex flex-col gap-5">
      <Card variant="paper" className="p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="font-mono text-sm text-bark break-all">{template.id}</div>
            <div className="mt-1 text-xs text-stem">
              {template.skill_ids.join(" · ")}
            </div>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {template.grades.map((g) => <span key={g} className="chip">{g}</span>)}
            <span className="chip">diff {template.difficulty}</span>
            <span className="chip">{template.type}</span>
            <span className="chip">{template.input_type}</span>
          </div>
        </div>

        <details className="mt-4">
          <summary className="text-xs uppercase tracking-wider text-stem cursor-pointer">
            Template YAML
          </summary>
          <pre className="mt-2 text-xs bg-chalk rounded-lg p-3 overflow-x-auto font-mono">
            {JSON.stringify(template.template, null, 2)}
          </pre>
        </details>

        <div className="mt-4">
          <label className="text-xs uppercase tracking-wider text-stem">
            Params override (JSON, fusionné avec template.params)
          </label>
          <Input
            as="textarea"
            rows={4}
            className="mt-1 font-mono text-xs"
            value={overrideText}
            onChange={(e) => setOverrideText(e.target.value)}
            placeholder='{"a_min": 10, "a_max": 99}'
          />
          <div className="mt-3 flex gap-2 items-center">
            <Button onClick={onRegenerate} disabled={loading}>
              {loading ? "…" : "Générer"}
            </Button>
            {error && <span className="text-xs text-rose">{error}</span>}
          </div>
        </div>
      </Card>

      {instance && (
        <div className="flex flex-col items-center gap-3">
          <ExerciseCard
            exercise={instance}
            skill={{
              id: template.skill_ids[0] || "",
              label: template.skill_ids[0] || template.id,
              grade: template.grades[0] || "P?",
            }}
            grade={template.grades[0] || "P3"}
            feedback={null}
            busy={false}
            onSubmit={onSubmit}
            onNext={() => {}}
          />
          <div className="text-xs text-stem text-center">
            Réponse attendue :{" "}
            <b className="font-mono text-bark">{JSON.stringify(instance.answer)}</b>
          </div>
          {submitted && (
            <div
              className={
                "px-4 py-2 rounded-lg font-display text-sm " +
                (submitted.ok ? "bg-sage-leaf/40 text-sage-deep" : "bg-rose-soft text-rose")
              }
            >
              Ta réponse : <b>{String(submitted.answer)}</b> ·{" "}
              {submitted.ok ? "✓ correct" : `✗ attendue : ${JSON.stringify(submitted.expected)}`}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function PlaygroundScreen() {
  const [templates, setTemplates] = useState([])
  const [loadingList, setLoadingList] = useState(true)
  const [listError, setListError] = useState(null)

  const [filters, setFilters] = useState({ grade: "", inputType: "", difficulty: "", skillId: "" })
  const [search, setSearch] = useState("")

  const [selectedId, setSelectedId] = useState(null)
  const [instance, setInstance] = useState(null)
  const [overrideText, setOverrideText] = useState("")
  const [loadingInstance, setLoadingInstance] = useState(false)
  const [instanceError, setInstanceError] = useState(null)

  useEffect(() => {
    setLoadingList(true)
    setListError(null)
    playgroundApi
      .listTemplates()
      .then((data) => setTemplates(data || []))
      .catch((err) => setListError(err.message || "Erreur"))
      .finally(() => setLoadingList(false))
  }, [])

  const setFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value }))

  const scopedExceptSkill = useMemo(() => {
    const s = search.trim().toLowerCase()
    return templates.filter((t) => {
      if (filters.grade && !t.grades.includes(filters.grade)) return false
      if (filters.inputType && t.input_type !== filters.inputType) return false
      if (filters.difficulty && String(t.difficulty) !== filters.difficulty) return false
      if (s) {
        const hay = (t.id + " " + t.skill_ids.join(" ")).toLowerCase()
        if (!hay.includes(s)) return false
      }
      return true
    })
  }, [templates, filters.grade, filters.inputType, filters.difficulty, search])

  const filtered = useMemo(() => {
    if (!filters.skillId) return scopedExceptSkill
    return scopedExceptSkill.filter((t) => t.skill_ids.includes(filters.skillId))
  }, [scopedExceptSkill, filters.skillId])

  const skills = useMemo(() => {
    const set = new Set()
    for (const t of scopedExceptSkill) for (const s of t.skill_ids) set.add(s)
    return Array.from(set).sort()
  }, [scopedExceptSkill])

  useEffect(() => {
    if (filters.skillId && !skills.includes(filters.skillId)) {
      setFilters((f) => ({ ...f, skillId: "" }))
    }
  }, [skills, filters.skillId])

  const selected = useMemo(
    () => templates.find((t) => t.id === selectedId) || null,
    [templates, selectedId],
  )

  const regenerate = async (template) => {
    if (!template) return
    setLoadingInstance(true)
    setInstanceError(null)
    let override = null
    const trimmed = overrideText.trim()
    if (trimmed) {
      try {
        override = JSON.parse(trimmed)
      } catch {
        setLoadingInstance(false)
        setInstanceError("JSON invalide")
        return
      }
    }
    try {
      const data = await playgroundApi.instantiate(template.id, override)
      setInstance(data)
    } catch (err) {
      setInstance(null)
      setInstanceError(err?.data?.detail || err.message || "Erreur")
    } finally {
      setLoadingInstance(false)
    }
  }

  const onSelect = (t) => {
    setSelectedId(t.id)
    setOverrideText("")
    setInstance(null)
    setInstanceError(null)
    regenerate(t)
  }

  return (
    <AppShell surface="plain">
      <Page maxWidth="3xl">
        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-bark">
            Atelier d'exercices
          </h1>
          <Link to="/" className="navlink">Retour</Link>
        </div>

        {listError && <p className="text-center text-rose">Erreur : {listError}</p>}

        <div className="grid md:grid-cols-[minmax(260px,1fr)_2fr] gap-6">
          <aside className="flex flex-col gap-3">
            <Filters
              filters={filters}
              setFilter={setFilter}
              search={search}
              setSearch={setSearch}
              skills={skills}
              total={templates.length}
              shown={filtered.length}
            />
            {loadingList ? (
              <div className="py-6"><Loader message="Chargement…" /></div>
            ) : (
              <div className="flex flex-col gap-1.5 max-h-[70vh] overflow-y-auto pr-1">
                {filtered.map((t) => (
                  <TemplateRow
                    key={t.id}
                    template={t}
                    selected={t.id === selectedId}
                    onClick={() => onSelect(t)}
                  />
                ))}
                {filtered.length === 0 && (
                  <p className="text-stem text-sm py-4">Aucun template.</p>
                )}
              </div>
            )}
          </aside>

          <section>
            <Detail
              template={selected}
              instance={instance}
              overrideText={overrideText}
              setOverrideText={setOverrideText}
              onRegenerate={() => regenerate(selected)}
              loading={loadingInstance}
              error={instanceError}
            />
          </section>
        </div>
      </Page>
    </AppShell>
  )
}
