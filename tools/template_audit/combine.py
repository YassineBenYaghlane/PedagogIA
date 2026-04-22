"""Combine Layer 2 metrics + Layer 3 findings into per-template scores and
per-skill summaries. Output used by report.md and dashboard.html.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import yaml

REPO = Path(__file__).resolve().parents[2]
L2 = REPO / "artifacts/audit/layer2.json"
L3 = REPO / "tools/template_audit/layer3.yaml"
OUT = REPO / "artifacts/audit/combined.json"


def load() -> tuple[dict, dict]:
    l2 = json.loads(L2.read_text())
    l3 = yaml.safe_load(L3.read_text())
    return l2, l3


def l3_flags_for(template_id: str, l3: dict) -> dict:
    flags = {"critical_bug": False, "broken_constraints": False, "degenerate": False, "thin": False, "fix": None}
    for b in l3.get("critical_bugs", []) or []:
        if b.get("id") == template_id and not b.get("resolved"):
            flags["critical_bug"] = True
            flags["fix"] = b["fix"]
    for b in l3.get("broken_constraints", []) or []:
        if isinstance(b, dict) and b.get("id") == template_id and not b.get("resolved"):
            flags["broken_constraints"] = True
            flags["fix"] = b["fix"]
    for item in l3.get("degenerate_heavy", []) or []:
        if not isinstance(item, dict) or item.get("resolved"):
            continue
        if template_id in (item.get("affected") or []):
            flags["degenerate"] = True
            flags["fix"] = item.get("fix")
        elif item.get("id") == template_id:
            flags["degenerate"] = True
            flags["fix"] = item.get("fix")
    return flags


def score_template(a: dict, flags: dict) -> dict:
    """0-100 quality score. 100 = perfect."""
    score = 100
    reasons = []
    if flags["critical_bug"]:
        score -= 60
        reasons.append("critical bug (Layer 3)")
    if a.get("generator_error"):
        score -= 30
        reasons.append("generator error")
    if a.get("retry_rate", 0) > 0.30:
        score -= 25
        reasons.append(f"high retry {a['retry_rate']*100:.0f}%")
    elif a.get("retry_rate", 0) > 0.05:
        score -= 10
        reasons.append(f"retry rate {a['retry_rate']*100:.0f}%")
    if a.get("degenerate_rate", 0) > 0.10:
        score -= 15
        reasons.append(f"degenerate {a['degenerate_rate']*100:.0f}%")
    vc = a.get("variant_count", 0)
    if vc < 20:
        score -= 25
        reasons.append(f"thin variety ({vc})")
    elif vc < 50:
        score -= 10
        reasons.append(f"low variety ({vc})")
    if a.get("render_issues"):
        score -= 20
        reasons.append("render issue")
    if a.get("mcq_issues"):
        score -= 20
        reasons.append("MCQ issue")
    if a.get("typography_issues"):
        score -= 5
        reasons.append("typography")
    return {"score": max(score, 0), "reasons": reasons}


def classify_skill_v2(skill: dict) -> str:
    """Override classify_skill using combined signal."""
    if skill["template_count"] == 0:
        return "no_coverage"
    if any(t["score"] < 40 for t in skill["templates"]):
        return "broken"
    if skill["total_variants"] < 20:
        return "thin"
    if len(skill["difficulty_tiers"]) == 1:
        return "single_tier"
    return "ok"


def main() -> int:
    l2, l3 = load()
    audits = l2["audits"]

    by_id = {}
    for a in audits:
        flags = l3_flags_for(a["id"], l3)
        score_info = score_template(a, flags)
        by_id[a["id"]] = {
            **{k: a[k] for k in a if k not in ("sample_prompts", "sample_answers", "generator_error", "degenerate_breakdown", "render_issues", "typography_issues", "mcq_issues")},
            "flags": flags,
            "score": score_info["score"],
            "score_reasons": score_info["reasons"],
            "sample_prompts": a.get("sample_prompts", [])[:3],
            "sample_answers": a.get("sample_answers", [])[:3],
            "degenerate_breakdown": a.get("degenerate_breakdown", {}),
            "render_issues": a.get("render_issues", {}),
            "typography_issues": a.get("typography_issues", {}),
            "mcq_issues": a.get("mcq_issues", {}),
            "generator_error": a.get("generator_error"),
        }

    # regroup by skill
    skills = {}
    for sid, s in l2["skills"].items():
        s2 = dict(s)
        s2["templates"] = [by_id[tid] for tid in s["templates"] if tid in by_id]
        s2["status"] = classify_skill_v2({
            "template_count": s["template_count"],
            "templates": s2["templates"],
            "total_variants": s["total_variants"],
            "difficulty_tiers": s["difficulty_tiers"],
        })
        avg_score = sum(t["score"] for t in s2["templates"]) / max(len(s2["templates"]), 1)
        s2["avg_score"] = round(avg_score, 1)
        s2["min_score"] = min((t["score"] for t in s2["templates"]), default=0)
        skills[sid] = s2

    out = {
        "meta": l2["meta"],
        "duplicates": l2.get("duplicates", {}),
        "templates": by_id,
        "skills": skills,
    }
    OUT.write_text(json.dumps(out, indent=2, ensure_ascii=False, default=str))
    print(f"Wrote {OUT}")

    # summary
    from collections import Counter
    statuses = Counter(s["status"] for s in skills.values())
    print(f"Skill status: {dict(statuses)}")
    print(f"Avg score overall: {sum(t['score'] for t in by_id.values()) / len(by_id):.1f}")
    bad = [t for t in by_id.values() if t["score"] < 60]
    print(f"Templates with score < 60: {len(bad)}")
    for t in sorted(bad, key=lambda x: x["score"])[:10]:
        print(f"  {t['score']:>3} {t['id']} — {', '.join(t['score_reasons'])}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
