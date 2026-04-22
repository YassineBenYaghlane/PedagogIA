"""Render combined.json as artifacts/audit/report.md + artifacts/audit/dashboard.html."""

from __future__ import annotations

import json
from collections import Counter, defaultdict
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
COMBINED = REPO / "artifacts/audit/combined.json"
OUT_MD = REPO / "artifacts/audit/report.md"
OUT_HTML = REPO / "artifacts/audit/dashboard.html"

STATUS_LABEL = {
    "ok": "✅ OK",
    "single_tier": "⚠️  Single tier",
    "thin": "🟡 Thin",
    "broken": "🔴 Broken",
    "no_coverage": "⛔ Missing",
}

STATUS_COLOR = {
    "ok": "#c7e0b5",
    "single_tier": "#f6edc5",
    "thin": "#f0d9a5",
    "broken": "#e8a6a1",
    "no_coverage": "#d8d8d8",
}


def render_report_md(c: dict) -> str:
    meta = c["meta"]
    skills = c["skills"]
    templates = c["templates"]
    statuses = Counter(s["status"] for s in skills.values())

    lines = []
    lines.append("# Template audit — 2026-04-22")
    lines.append("")
    lines.append(f"**Overview:** {meta['n_templates']} templates across {meta['n_skills']} skills, "
                 f"{meta['total_variants']:,} total variants (sum over templates).")
    lines.append("")
    lines.append("## Executive summary")
    lines.append("")
    lines.append("| Metric | Value |")
    lines.append("|---|---|")
    lines.append(f"| Templates | {meta['n_templates']} |")
    lines.append(f"| Skills | {meta['n_skills']} |")
    lines.append(f"| Total variants (sum) | {meta['total_variants']:,} |")
    avg_score = sum(t["score"] for t in templates.values()) / len(templates)
    lines.append(f"| Average quality score | {avg_score:.1f}/100 |")
    below60 = sum(1 for t in templates.values() if t["score"] < 60)
    lines.append(f"| Templates below 60/100 | {below60} |")
    lines.append(f"| Duplicate template IDs | {len(c.get('duplicates') or {})} |")
    lines.append("")
    lines.append("**Skill coverage status:**")
    lines.append("")
    for status, count in sorted(statuses.items(), key=lambda x: -x[1]):
        lines.append(f"- {STATUS_LABEL[status]}: {count} skills")
    lines.append("")

    # Duplicates
    dups = c.get("duplicates") or {}
    if dups:
        lines.append("## Duplicate template IDs")
        lines.append("")
        lines.append("These IDs appear more than once — `seed_templates` silently overwrites with the last occurrence:")
        lines.append("")
        for tid, files in dups.items():
            lines.append(f"- `{tid}` — {', '.join(files)}")
        lines.append("")

    # Low-score templates
    lines.append("## Templates needing attention (score < 60)")
    lines.append("")
    lines.append("| Template | Skill | Score | Issues |")
    lines.append("|---|---|---|---|")
    bad = sorted([t for t in templates.values() if t["score"] < 60], key=lambda t: t["score"])
    for t in bad:
        reasons = ", ".join(t["score_reasons"])
        lines.append(f"| `{t['id']}` | {t.get('skill_id')} | {t['score']} | {reasons} |")
    lines.append("")

    # Per-grade skill status
    lines.append("## Per-grade skill coverage")
    lines.append("")
    for grade in ["P1", "P2", "P3", "P4", "P5", "P6"]:
        g_skills = [s for s in skills.values() if s["grade"] == grade]
        g_status = Counter(s["status"] for s in g_skills)
        ok = g_status.get("ok", 0)
        total = len(g_skills)
        lines.append(f"### {grade} — {total} skills ({ok} ok)")
        lines.append("")
        lines.append("| Skill | Status | Templates | Tiers | Variants | Avg score |")
        lines.append("|---|---|---|---|---|---|")
        for s in sorted(g_skills, key=lambda x: (x["status"] != "broken", x["status"] != "thin", -x["total_variants"])):
            tiers = ",".join(str(t) for t in s["difficulty_tiers"]) or "—"
            lines.append(
                f"| {s['label']} | {STATUS_LABEL[s['status']]} | {s['template_count']} | {tiers} | {s['total_variants']} | {s['avg_score']} |"
            )
        lines.append("")

    # Planned modifications
    lines.append("## Planned modifications")
    lines.append("")
    lines.append("See `tools/template_audit/layer3.yaml` for the full set of findings. "
                 "The aggressive-mode pass applies:")
    lines.append("")
    lines.append("1. **Fix critical bugs** (semantic mismatches): pair/impair template, "
                 "num_decomposer_1 drag_order, num_compter_decimaux step, input_type mismatches, "
                 "milliard decomposition places.")
    lines.append("2. **Fix broken constraints**: teach the generator to compute the complement "
                 "directly when `result_min == result_max` (fixes the 53%/61% retry rates).")
    lines.append("3. **De-trivialise multiplication tables**: bump `b_min` from 1 to 2 "
                 "and `b_max` from 10 to 12 on all mult_Tx templates (kills the b=1 degenerate).")
    lines.append("4. **Widen parameter ranges** for thin-variety skills (cm_mult_par_*, "
                 "cm_div_par_*, div_vocabulaire, mult_sens, div_sens, etc.).")
    lines.append("5. **Add difficulty-2 tiers** for single-tier skills with acceptable variety — "
                 "typically MCQ forms, wider ranges, or inverse operations.")
    lines.append("6. **Deduplicate IDs** — rename duplicate template IDs.")
    lines.append("")
    lines.append("Re-running the audit after modifications should move the skill-status histogram "
                 "from ~30% `ok` to >80% `ok`, eliminate `broken`, and raise the average "
                 "quality score from ~88 toward ~95.")
    lines.append("")
    return "\n".join(lines)


def render_dashboard_html(c: dict) -> str:
    skills = c["skills"]
    templates = c["templates"]
    meta = c["meta"]

    grades = ["P1", "P2", "P3", "P4", "P5", "P6"]
    by_grade: dict[str, list] = defaultdict(list)
    for s in skills.values():
        by_grade[s["grade"]].append(s)
    for g in grades:
        by_grade[g].sort(key=lambda x: x["id"])

    data_json = json.dumps({"templates": templates, "skills": skills, "meta": meta}, default=str, ensure_ascii=False)

    cells_html = []
    for g in grades:
        cells_html.append(f'<div class="grade-col"><h2>{g}</h2><div class="cells">')
        for s in by_grade[g]:
            color = STATUS_COLOR[s["status"]]
            # compute variant intensity (log scale) for sub-shade
            v = s["total_variants"]
            cells_html.append(
                f'<button class="cell" data-skill="{s["id"]}" style="background:{color}">'
                f'<span class="label">{s["label"]}</span>'
                f'<span class="meta">{s["template_count"]} tmpl · {v} variantes · tiers {"".join(str(t) for t in s["difficulty_tiers"]) or "—"} · {s["avg_score"]}/100</span>'
                f'</button>'
            )
        cells_html.append("</div></div>")

    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>PedagogIA · Template audit 2026-04-22</title>
<style>
  :root {{
    --bone:#FFFFFF; --chalk:#F6F8F3; --mist:#ECF1E7; --sage:#6FA274;
    --sage-deep:#3F6F4A; --sage-leaf:#C7E0B5; --sky:#B8DCEA; --sky-deep:#4F8BAC;
    --bark:#2B3A2E; --stem:#5C6B5F; --honey:#E8C66A; --rose:#E8A6A1;
  }}
  * {{ box-sizing: border-box; }}
  body {{ margin:0; font-family:system-ui,-apple-system,"Inter",sans-serif;
         background:var(--chalk); color:var(--bark); padding:24px; }}
  h1 {{ font-family:"Fraunces",Georgia,serif; font-style:italic; font-weight:500;
        margin:0 0 6px; color:var(--sage-deep); }}
  h2 {{ font-family:"Fraunces",Georgia,serif; font-style:italic; font-weight:500;
        margin:0 0 12px; font-size:20px; color:var(--stem); }}
  .stats {{ display:flex; gap:18px; margin:12px 0 28px; flex-wrap:wrap; }}
  .stat {{ background:var(--bone); border:1px solid var(--mist); padding:10px 16px;
          border-radius:10px; min-width:120px; }}
  .stat .v {{ font-size:22px; font-weight:600; }}
  .stat .l {{ font-size:12px; color:var(--stem); }}
  .legend {{ display:flex; gap:16px; margin-bottom:20px; font-size:13px; }}
  .legend span {{ display:inline-flex; align-items:center; gap:6px; }}
  .legend i {{ width:14px; height:14px; border-radius:3px; display:inline-block; }}
  .grid {{ display:grid; grid-template-columns:repeat(6,1fr); gap:16px; }}
  .grade-col {{ background:var(--bone); border-radius:12px; padding:14px;
                border:1px solid var(--mist); }}
  .cells {{ display:flex; flex-direction:column; gap:6px; }}
  .cell {{ text-align:left; padding:8px 10px; border:1px solid rgba(0,0,0,0.06);
          border-radius:8px; font:inherit; cursor:pointer; display:flex;
          flex-direction:column; gap:2px; transition:transform 120ms; }}
  .cell:hover {{ transform:translateY(-1px); border-color:var(--sage-deep); }}
  .cell .label {{ font-size:13px; font-weight:500; line-height:1.25; }}
  .cell .meta {{ font-size:11px; color:var(--bark); opacity:0.72; }}
  .drawer {{ position:fixed; inset:0; background:rgba(43,58,46,0.4); display:none;
             align-items:center; justify-content:center; padding:40px; z-index:10; }}
  .drawer.open {{ display:flex; }}
  .drawer-inner {{ background:var(--bone); max-width:900px; width:100%; max-height:86vh;
                   overflow:auto; padding:28px 32px; border-radius:14px;
                   font-size:14px; }}
  .drawer-inner h3 {{ font-family:"Fraunces",Georgia,serif; font-style:italic;
                      margin:0 0 6px; font-size:24px; color:var(--sage-deep); }}
  .drawer-inner code {{ background:var(--mist); padding:2px 6px; border-radius:4px;
                        font:12.5px/1.4 "JetBrains Mono",monospace; }}
  .tmpl {{ background:var(--chalk); border:1px solid var(--mist); border-radius:8px;
          padding:12px 14px; margin:10px 0; }}
  .tmpl .score {{ display:inline-block; padding:2px 8px; border-radius:10px;
                  font-weight:600; font-size:12px; }}
  .tmpl .score.hi {{ background:var(--sage-leaf); color:var(--sage-deep); }}
  .tmpl .score.mid {{ background:#F6EDC5; color:#8a6a10; }}
  .tmpl .score.lo {{ background:var(--rose); color:#7a2a26; }}
  .sample {{ font-family:"JetBrains Mono",monospace; font-size:12px; color:var(--bark);
            background:var(--bone); padding:6px 8px; border-radius:4px; margin:4px 0;
            border-left:2px solid var(--sage); }}
  .close {{ float:right; cursor:pointer; border:none; background:transparent;
            font-size:20px; color:var(--stem); }}
  .flag {{ font-size:11px; padding:2px 6px; border-radius:4px; margin-right:4px;
          display:inline-block; background:var(--rose); color:#7a2a26; }}
  .filter {{ margin:18px 0; display:flex; gap:8px; flex-wrap:wrap; }}
  .filter button {{ background:var(--bone); border:1px solid var(--mist);
                    padding:6px 12px; border-radius:6px; cursor:pointer;
                    font:inherit; font-size:12px; }}
  .filter button.active {{ background:var(--sage); color:var(--bone);
                           border-color:var(--sage-deep); }}
</style>
</head>
<body>
  <h1>Template audit</h1>
  <p style="color:var(--stem); margin:4px 0 0;">{meta['n_templates']} templates · {meta['n_skills']} skills · seed {meta.get('seed','?')} · sample N={meta.get('sample_n','?')} · 2026-04-22</p>

  <div class="stats">
    <div class="stat"><div class="v">{meta['n_templates']}</div><div class="l">templates</div></div>
    <div class="stat"><div class="v">{meta['n_skills']}</div><div class="l">skills</div></div>
    <div class="stat"><div class="v">{meta['total_variants']:,}</div><div class="l">variantes (somme)</div></div>
    <div class="stat"><div class="v">{sum(1 for s in skills.values() if s['status']=='ok')}</div><div class="l">skills ok</div></div>
    <div class="stat"><div class="v">{sum(1 for s in skills.values() if s['status']=='broken')}</div><div class="l">broken</div></div>
    <div class="stat"><div class="v">{sum(1 for s in skills.values() if s['status']=='thin')}</div><div class="l">thin</div></div>
    <div class="stat"><div class="v">{sum(1 for s in skills.values() if s['status']=='single_tier')}</div><div class="l">single tier</div></div>
  </div>

  <div class="legend">
    <span><i style="background:#c7e0b5"></i>OK</span>
    <span><i style="background:#f6edc5"></i>Single tier</span>
    <span><i style="background:#f0d9a5"></i>Thin</span>
    <span><i style="background:#e8a6a1"></i>Broken</span>
  </div>

  <div class="filter" id="filter">
    <button class="active" data-f="all">Tout</button>
    <button data-f="broken">Broken</button>
    <button data-f="thin">Thin</button>
    <button data-f="single_tier">Single tier</button>
    <button data-f="ok">OK</button>
  </div>

  <div class="grid">
    {''.join(cells_html)}
  </div>

  <div class="drawer" id="drawer">
    <div class="drawer-inner">
      <button class="close" onclick="closeDrawer()">×</button>
      <div id="drawer-content"></div>
    </div>
  </div>

<script id="data" type="application/json">{data_json}</script>
<script>
  const DATA = JSON.parse(document.getElementById('data').textContent);

  function openSkill(sid) {{
    const s = DATA.skills[sid];
    if (!s) return;
    let html = `<h3>${{s.label}}</h3>`;
    html += `<p style="color:var(--stem); margin:2px 0 14px;">${{s.grade}} · ${{sid}} · ${{s.template_count}} templates · ${{s.total_variants}} variantes · tiers ${{s.difficulty_tiers.join(',') || '—'}} · score moyen ${{s.avg_score}}/100</p>`;
    if (s.templates.length === 0) {{
      html += '<p>Pas de template pour cette compétence.</p>';
    }} else {{
      for (const t of s.templates) {{
        const scoreCls = t.score >= 80 ? 'hi' : (t.score >= 60 ? 'mid' : 'lo');
        html += `<div class="tmpl">`;
        html += `<div><span class="score ${{scoreCls}}">${{t.score}}/100</span> <code>${{t.id}}</code> · ${{t.template_type}} · diff ${{t.difficulty}} · ${{t.variant_count}} variantes</div>`;
        if (t.score_reasons.length) {{
          html += `<div style="margin:6px 0; font-size:12px;">`;
          for (const r of t.score_reasons) html += `<span class="flag">${{r}}</span>`;
          html += `</div>`;
        }}
        if (t.flags.fix) html += `<div style="font-size:12px; color:var(--stem);"><b>Fix:</b> ${{t.flags.fix}}</div>`;
        if (t.sample_prompts.length) {{
          for (let i = 0; i < t.sample_prompts.length; i++) {{
            html += `<div class="sample">${{t.sample_prompts[i]}} → <b>${{t.sample_answers[i]}}</b></div>`;
          }}
        }}
        if (t.generator_error) html += `<div style="color:#7a2a26; font-size:12px;">${{t.generator_error}}</div>`;
        html += `</div>`;
      }}
    }}
    document.getElementById('drawer-content').innerHTML = html;
    document.getElementById('drawer').classList.add('open');
  }}

  function closeDrawer() {{ document.getElementById('drawer').classList.remove('open'); }}

  document.querySelectorAll('.cell').forEach(el => {{
    el.addEventListener('click', () => openSkill(el.dataset.skill));
  }});
  document.getElementById('drawer').addEventListener('click', e => {{
    if (e.target.id === 'drawer') closeDrawer();
  }});

  document.querySelectorAll('#filter button').forEach(btn => {{
    btn.addEventListener('click', () => {{
      const f = btn.dataset.f;
      document.querySelectorAll('#filter button').forEach(b => b.classList.toggle('active', b === btn));
      document.querySelectorAll('.cell').forEach(el => {{
        const sid = el.dataset.skill;
        const s = DATA.skills[sid];
        el.style.display = (f === 'all' || s.status === f) ? '' : 'none';
      }});
    }});
  }});
</script>
</body>
</html>"""


def main() -> int:
    c = json.loads(COMBINED.read_text())
    OUT_MD.write_text(render_report_md(c))
    OUT_HTML.write_text(render_dashboard_html(c))
    print(f"Wrote {OUT_MD}")
    print(f"Wrote {OUT_HTML}")
    return 0


if __name__ == "__main__":
    import sys
    sys.exit(main())
