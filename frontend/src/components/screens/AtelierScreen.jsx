import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router"
import AppShell from "../layout/AppShell"
import Page from "../layout/Page"
import TopBar from "../layout/TopBar"
import { TopBarBack, TopBarLink } from "../layout/TopBarActions"
import Loader from "../ui/Loader"
import { atelierApi } from "../../api/atelier"

const GRADES = ["P1", "P2", "P3", "P4", "P5", "P6"]

const STATUS_STYLE = {
  ok: { bg: "bg-sage-leaf/60", border: "border-sage", dot: "bg-sage-deep", label: "OK" },
  single_tier: {
    bg: "bg-honey-soft/70",
    border: "border-honey",
    dot: "bg-honey",
    label: "1 palier",
  },
  thin: { bg: "bg-honey/50", border: "border-honey", dot: "bg-honey", label: "Maigre" },
  broken: { bg: "bg-rose-soft", border: "border-rose", dot: "bg-rose", label: "Cassé" },
  no_coverage: {
    bg: "bg-mist",
    border: "border-bark/10",
    dot: "bg-bark/20",
    label: "Sans template",
  },
}

const FILTERS = [
  { id: "all", label: "Tout" },
  { id: "broken", label: "Cassés" },
  { id: "thin", label: "Maigres" },
  { id: "single_tier", label: "1 palier" },
  { id: "ok", label: "OK" },
]

function statusStyle(status) {
  return STATUS_STYLE[status] ?? STATUS_STYLE.no_coverage
}

function SkillCell({ skill, onClick }) {
  const style = statusStyle(skill.status)
  const score = skill.avg_score
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${style.bg} border ${style.border} rounded-xl px-3 py-2.5 text-left transition hover:-translate-y-px hover:shadow-leaf w-full`}
    >
      <div className="flex items-start gap-2">
        <span className={`mt-1.5 h-2 w-2 rounded-full ${style.dot}`} aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-bark truncate" title={skill.label}>
            {skill.label}
          </div>
          <div className="mt-0.5 text-xs text-stem font-mono">
            {skill.template_count} tpl · {skill.total_variants ?? "—"} var
            {skill.difficulty_tiers?.length ? ` · d${skill.difficulty_tiers.join("")}` : ""}
          </div>
          {score != null && (
            <div className="mt-0.5 text-xs text-stem">score {score}</div>
          )}
        </div>
      </div>
    </button>
  )
}

function StatCard({ label, value, tone = "bark" }) {
  const toneClass = {
    bark: "text-bark",
    sage: "text-sage-deep",
    rose: "text-rose",
    honey: "text-honey",
  }[tone]
  return (
    <div className="specimen px-4 py-3">
      <div className="text-xs uppercase tracking-wide text-stem">{label}</div>
      <div className={`mt-1 font-display text-2xl ${toneClass}`}>{value}</div>
    </div>
  )
}

export default function AtelierScreen() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [difficultyFilter, setDifficultyFilter] = useState("all")
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false
    atelierApi
      .audit()
      .then((d) => {
        if (!cancelled) setData(d)
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || "Erreur")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const allTemplateTypes = useMemo(() => {
    const set = new Set()
    for (const skill of Object.values(data?.skills || {})) {
      for (const tpl of skill.templates || []) {
        if (tpl.template_type) set.add(tpl.template_type)
      }
    }
    return [...set].sort()
  }, [data])

  const skillMatchesTemplates = (skill) => {
    if (typeFilter === "all" && difficultyFilter === "all") return true
    const templates = skill.templates || []
    if (!templates.length) return false
    return templates.some((tpl) => {
      if (typeFilter !== "all" && tpl.template_type !== typeFilter) return false
      if (difficultyFilter !== "all" && String(tpl.difficulty) !== difficultyFilter) return false
      return true
    })
  }

  const byGrade = useMemo(() => {
    if (!data) return {}
    const out = Object.fromEntries(GRADES.map((g) => [g, []]))
    for (const skill of Object.values(data.skills || {})) {
      const grade = GRADES.includes(skill.grade) ? skill.grade : null
      if (!grade) continue
      if (filter !== "all" && skill.status !== filter) continue
      if (!skillMatchesTemplates(skill)) continue
      out[grade].push(skill)
    }
    for (const g of GRADES) {
      out[g].sort((a, b) => a.label.localeCompare(b.label, "fr"))
    }
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, filter, typeFilter, difficultyFilter])

  const counts = useMemo(() => {
    const c = { total: 0, ok: 0, broken: 0, thin: 0, single_tier: 0, no_coverage: 0 }
    for (const s of Object.values(data?.skills || {})) {
      c.total += 1
      c[s.status] = (c[s.status] ?? 0) + 1
    }
    return c
  }, [data])

  const visibleCount = useMemo(
    () => Object.values(byGrade).reduce((n, arr) => n + arr.length, 0),
    [byGrade],
  )
  const filtersActive =
    filter !== "all" || typeFilter !== "all" || difficultyFilter !== "all"
  const resetFilters = () => {
    setFilter("all")
    setTypeFilter("all")
    setDifficultyFilter("all")
  }

  return (
    <AppShell
      surface="plain"
      topBar={
        <TopBar
          leading={<TopBarBack to="/" label="Serre" />}
          title="Atelier"
          trailing={<TopBarLink to="/debug/inputs" icon="tune">Types d'inputs</TopBarLink>}
        />
      }
    >
      <Page maxWidth="full">
        <div className="mb-6">
          <p className="text-sm text-stem">
            Santé des templates par compétence (P1 → P6).
            {data?.meta?.source === "live" && (
              <span className="ml-2 chip chip-honey">données live (pas d'audit)</span>
            )}
          </p>
        </div>

        {loading && (
          <div className="py-16">
            <Loader message="Chargement…" />
          </div>
        )}
        {error && <p className="text-center text-rose">Erreur : {error}</p>}

        {data && !loading && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
              <StatCard label="Compétences" value={counts.total} />
              <StatCard label="OK" value={counts.ok} tone="sage" />
              <StatCard label="1 palier" value={counts.single_tier} tone="honey" />
              <StatCard label="Maigres" value={counts.thin} tone="honey" />
              <StatCard label="Cassés" value={counts.broken} tone="rose" />
              <StatCard label="Sans couverture" value={counts.no_coverage} />
            </div>

            <div className="flex flex-col gap-3 mb-4">
              <div className="flex flex-wrap gap-2">
                {FILTERS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFilter(f.id)}
                    className={`pill ${filter === f.id ? "" : "pill-ghost"} px-3 py-1.5 text-xs`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-stem">
                  <span className="uppercase tracking-wider">Type</span>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="rounded-lg border border-bark/15 bg-bone px-3 py-1.5 font-mono text-xs text-bark focus:outline-none focus:ring-2 focus:ring-sage"
                  >
                    <option value="all">Tous</option>
                    {allTemplateTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-2 text-xs text-stem">
                  <span className="uppercase tracking-wider">Difficulté</span>
                  <select
                    value={difficultyFilter}
                    onChange={(e) => setDifficultyFilter(e.target.value)}
                    className="rounded-lg border border-bark/15 bg-bone px-3 py-1.5 font-mono text-xs text-bark focus:outline-none focus:ring-2 focus:ring-sage"
                  >
                    <option value="all">Toutes</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                  </select>
                </label>
                <span className="text-xs text-stem">
                  {visibleCount} / {counts.total} compétence{counts.total > 1 ? "s" : ""}
                </span>
                {filtersActive && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="pill pill-ghost px-3 py-1.5 text-xs"
                  >
                    Réinitialiser
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {GRADES.map((grade) => (
                <section key={grade}>
                  <div className="text-xs uppercase tracking-wider text-stem font-medium mb-2 pb-1 border-b border-bark/10">
                    {grade}
                    <span className="ml-2 text-bark/50 font-mono normal-case">
                      {byGrade[grade]?.length ?? 0}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {(byGrade[grade] || []).map((skill) => (
                      <SkillCell
                        key={skill.id}
                        skill={skill}
                        onClick={() =>
                          navigate(`/atelier/skill/${encodeURIComponent(skill.id)}`)
                        }
                      />
                    ))}
                    {(byGrade[grade] || []).length === 0 && (
                      <div className="text-xs text-stem/60 italic">—</div>
                    )}
                  </div>
                </section>
              ))}
            </div>
          </>
        )}
      </Page>
    </AppShell>
  )
}
