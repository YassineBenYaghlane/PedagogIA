import { useEffect, useState } from "react"
import { useParams } from "react-router"
import AppShell from "../layout/AppShell"
import Page from "../layout/Page"
import TopBar from "../layout/TopBar"
import { TopBarBack } from "../layout/TopBarActions"
import Loader from "../ui/Loader"
import { atelierApi } from "../../api/atelier"

function scoreTone(score) {
  if (score == null) return "text-stem"
  if (score >= 80) return "text-sage-deep"
  if (score >= 60) return "text-honey"
  return "text-rose"
}

function formatAnswer(answer) {
  if (answer == null) return "—"
  if (typeof answer === "object") return JSON.stringify(answer)
  return String(answer)
}

function TemplateRow({ tpl }) {
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const generate = async () => {
    setLoading(true)
    setError(null)
    try {
      const p = await atelierApi.preview(tpl.id)
      setPreview(p)
    } catch (e) {
      setError(e.message || "Erreur")
    } finally {
      setLoading(false)
    }
  }

  const audit = tpl.score != null
  const flags = tpl.flags || {}
  const flagsList = [
    flags.critical_bug && "bug critique",
    flags.broken_constraints && "contraintes cassées",
    flags.degenerate && "variantes dégénérées",
    flags.thin && "maigre",
  ].filter(Boolean)

  return (
    <article className="specimen p-4">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <code className="font-mono text-sm text-bark">{tpl.id}</code>
            <span className="chip">d{tpl.difficulty}</span>
            <span className="chip chip-sky">{tpl.input_type}</span>
            {tpl.template_type && <span className="chip">{tpl.template_type}</span>}
            {tpl.operation && <span className="chip">{tpl.operation}</span>}
          </div>
          <div className="mt-2 text-xs text-stem font-mono truncate" title={tpl.prompt_template}>
            {tpl.prompt_template || <span className="italic">sans prompt_template</span>}
          </div>
        </div>
        <div className="text-right shrink-0">
          {audit && (
            <>
              <div className={`font-display text-xl ${scoreTone(tpl.score)}`}>
                {tpl.score}
                <span className="text-xs text-stem font-body">/100</span>
              </div>
              <div className="text-xs text-stem">{tpl.variant_count ?? "—"} variantes</div>
            </>
          )}
        </div>
      </header>

      {(tpl.score_reasons?.length > 0 || flagsList.length > 0) && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {flagsList.map((f) => (
            <span key={f} className="chip chip-bark">{f}</span>
          ))}
          {tpl.score_reasons?.map((r) => (
            <span key={r} className="text-xs text-stem">· {r}</span>
          ))}
        </div>
      )}

      {flags.fix && (
        <div className="mt-2 text-xs text-sage-deep bg-sage-pale/40 rounded-lg px-3 py-2">
          <span className="font-medium">Fix&nbsp;:</span> {flags.fix}
        </div>
      )}

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={generate}
          disabled={loading}
          className="pill pill-ghost px-3 py-1.5 text-xs"
        >
          {loading ? "…" : "Générer"}
        </button>
        {tpl.sample_prompts?.length > 0 && !preview && !loading && (
          <span className="text-xs text-stem italic">
            exemples audit&nbsp;: {tpl.sample_prompts.length}
          </span>
        )}
      </div>

      {!preview && tpl.sample_prompts?.length > 0 && (
        <div className="mt-3 grid gap-2">
          {tpl.sample_prompts.slice(0, 3).map((p, i) => (
            <div key={i} className="text-xs font-mono bg-mist/60 rounded px-2 py-1.5">
              <span className="text-bark">{p}</span>
              {tpl.sample_answers?.[i] != null && (
                <span className="text-stem ml-2">→ {formatAnswer(tpl.sample_answers[i])}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {error && <p className="mt-3 text-xs text-rose">Erreur : {error}</p>}

      {preview && (
        <div className="mt-3 bg-chalk border border-bark/10 rounded-lg p-3">
          {preview.error ? (
            <div className="text-xs text-rose font-mono">{preview.error}</div>
          ) : (
            <>
              <div className="text-sm text-bark">{preview.prompt}</div>
              <div className="mt-2 text-xs text-sage-deep">
                <span className="text-stem">réponse&nbsp;: </span>
                <span className="font-mono">{formatAnswer(preview.answer)}</span>
              </div>
              <details className="mt-2">
                <summary className="text-xs text-stem cursor-pointer">params</summary>
                <pre className="mt-1 text-xs font-mono text-stem overflow-x-auto">
                  {JSON.stringify(preview.params, null, 2)}
                </pre>
              </details>
            </>
          )}
        </div>
      )}
    </article>
  )
}

export default function AtelierSkillScreen() {
  const { skillId } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    atelierApi
      .skill(skillId)
      .then((d) => {
        if (!cancelled) {
          setData(d)
          setError(null)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setData(null)
          setError(e.message || "Erreur")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [skillId])

  return (
    <AppShell
      surface="plain"
      topBar={
        <TopBar leading={<TopBarBack to="/atelier" label="Atelier" />} title="Compétence" />
      }
    >
      <Page maxWidth="3xl">
        <div className="mb-6 min-w-0">
          <h1 className="font-display text-2xl md:text-3xl font-semibold text-bark truncate">
            {data?.skill?.label || skillId}
          </h1>
          <div className="mt-1 flex items-center gap-2 text-xs text-stem flex-wrap">
            <span className="chip">{data?.skill?.grade || "—"}</span>
            <code className="font-mono">{skillId}</code>
            {data?.summary?.status && (
              <span className="chip chip-sky">{data.summary.status}</span>
            )}
            {data?.summary?.avg_score != null && (
              <span>· score moyen {data.summary.avg_score}</span>
            )}
            {data?.summary?.total_variants != null && (
              <span>· {data.summary.total_variants} variantes</span>
            )}
          </div>
        </div>

        {loading && (
          <div className="py-16">
            <Loader message="Chargement…" />
          </div>
        )}
        {error && <p className="text-center text-rose">Erreur : {error}</p>}

        {data && !loading && (
          <div className="grid gap-4">
            {data.templates.map((tpl) => (
              <TemplateRow key={tpl.id} tpl={tpl} />
            ))}
            {data.templates.length === 0 && (
              <div className="specimen p-6 text-center text-stem">
                Aucun template pour cette compétence.
              </div>
            )}
          </div>
        )}
      </Page>
    </AppShell>
  )
}
