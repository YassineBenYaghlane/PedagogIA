"""Layer 2 structural audit for PedagogIA exercise templates.

Reads every exercise_templates_p*.yaml, instantiates each template N times,
produces per-template metrics + per-skill coverage + issue list.

Usage: uv run python tools/template_audit/layer2.py
Output: artifacts/audit/layer2.json
"""

from __future__ import annotations

import hashlib
import json
import random
import re
import sys
import traceback
from collections import Counter, defaultdict
from pathlib import Path

import yaml

REPO = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO / "backend"))

from src.services import exercise_gen  # noqa: E402

SAMPLE_N = 1000
SEED = 20260422
TEMPLATE_FILES = sorted((REPO / "backend/src/skill_tree").glob("exercise_templates_p*.yaml"))
SKILLS_FILE = REPO / "backend/src/skill_tree/skills.yaml"
OUT = REPO / "artifacts/audit/layer2.json"


def load_all_templates():
    all_t = []
    for f in TEMPLATE_FILES:
        docs = yaml.safe_load(f.read_text())
        for t in docs or []:
            t["_source_file"] = f.name
            all_t.append(t)
    return all_t


def load_skills():
    docs = yaml.safe_load(SKILLS_FILE.read_text())
    return {s["id"]: s for s in docs}


# ---------------------------------------------------------------------------
# Structural checks
# ---------------------------------------------------------------------------


PLACEHOLDER_RE = re.compile(r"\{[a-zA-Z_]+\}")


def check_rendering(prompt: str) -> list[str]:
    issues = []
    if PLACEHOLDER_RE.search(prompt):
        issues.append(f"unrendered placeholder: {PLACEHOLDER_RE.findall(prompt)}")
    if "None" in prompt:
        issues.append("None in prompt")
    return issues


def check_typography(prompt: str) -> list[str]:
    issues = []
    # French typography: space before : ? ! ; (prefer narrow nbsp but regular space ok)
    for p in [":", "?", "!", ";"]:
        m = re.search(rf"\S{re.escape(p)}", prompt)
        if m:
            issues.append(f"missing space before '{p}'")
    return issues


def check_mcq(instance: dict) -> list[str]:
    issues = []
    opts = instance.get("params", {}).get("options")
    ans = instance.get("answer")
    if opts is None:
        return ["missing options"]
    if ans not in opts:
        issues.append("answer not in options")
    if len(set(opts)) != len(opts):
        issues.append("duplicate options")
    if len(opts) < 2:
        issues.append(f"too few options ({len(opts)})")
    return issues


def is_degenerate(template: dict, instance: dict) -> str | None:
    """Return degeneracy label if the instance is trivial, else None."""
    ttype = template["template"]["type"]
    params = instance.get("params", {})
    a = params.get("a")
    b = params.get("b")
    op = template["template"].get("operation")
    if ttype in ("computation", "mcq", "fill_blank") and op:
        if a == 0 and b == 0:
            return "a=0_and_b=0"
        if op == "add" and (a == 0 or b == 0):
            return "add_identity_zero"
        if op == "subtract" and b == 0:
            return "subtract_identity_zero"
        if op == "subtract" and a == b:
            return "subtract_equal"
        if op == "multiply" and (a == 1 or b == 1):
            return "multiply_identity_one"
        if op == "multiply" and (a == 0 or b == 0):
            return "multiply_by_zero"
        if op == "divide" and b == 1:
            return "divide_by_one"
        if op == "divide" and a == b and b != 0:
            return "divide_equal"
    if ttype == "comparison":
        if a == b:
            return "comparison_equal"
    return None


# ---------------------------------------------------------------------------
# Sampling
# ---------------------------------------------------------------------------


def params_hash(params) -> str:
    """Stable hash over instantiation params."""
    s = json.dumps(params, sort_keys=True, default=str)
    return hashlib.md5(s.encode()).hexdigest()[:12]


def audit_template(t: dict) -> dict:
    """Run N instantiations, collect metrics."""
    random.seed(SEED)

    variant_hashes: set[str] = set()
    render_issues: Counter = Counter()
    typo_issues: Counter = Counter()
    mcq_issues: Counter = Counter()
    degenerate_counts: Counter = Counter()
    generator_errors: list[str] = []
    sample_prompts: list[str] = []
    sample_answers: list = []

    successful = 0
    # Use instantiate() which picks generator. We already track retries inside
    # generator (MAX_RETRIES=50), so each call either succeeds or raises.
    for i in range(SAMPLE_N):
        try:
            inst = exercise_gen.instantiate(t["template"])
        except Exception as e:
            generator_errors.append(f"{type(e).__name__}: {e}")
            continue
        successful += 1
        variant_hashes.add(params_hash(inst.get("params", {})))

        prompt = inst.get("prompt", "")
        for issue in check_rendering(prompt):
            render_issues[issue] += 1
        for issue in check_typography(prompt):
            typo_issues[issue] += 1
        if t.get("input_type") == "mcq" or t["template"]["type"] == "mcq":
            for issue in check_mcq(inst):
                mcq_issues[issue] += 1
        deg = is_degenerate(t, inst)
        if deg:
            degenerate_counts[deg] += 1

        if i < 5:
            sample_prompts.append(prompt)
            sample_answers.append(inst.get("answer"))

    failed = SAMPLE_N - successful
    first_error = generator_errors[0] if generator_errors else None
    variant_count = len(variant_hashes)
    degenerate_rate = sum(degenerate_counts.values()) / max(successful, 1)

    return {
        "id": t["id"],
        "skill_id": t.get("skill_id"),
        "skills": t.get("skills"),
        "difficulty": t.get("difficulty", 1),
        "input_type": t.get("input_type"),
        "template_type": t["template"]["type"],
        "operation": t["template"].get("operation"),
        "source_file": t["_source_file"],
        "variant_count": variant_count,
        "variant_estimate_label": f">={variant_count}" if variant_count >= 800 else str(variant_count),
        "retry_rate": round(failed / SAMPLE_N, 4),
        "degenerate_rate": round(degenerate_rate, 4),
        "degenerate_breakdown": dict(degenerate_counts),
        "render_issues": dict(render_issues),
        "typography_issues": dict(typo_issues),
        "mcq_issues": dict(mcq_issues),
        "generator_error": first_error,
        "successful_samples": successful,
        "sample_prompts": sample_prompts,
        "sample_answers": [str(a) for a in sample_answers],
    }


# ---------------------------------------------------------------------------
# Aggregation
# ---------------------------------------------------------------------------


def find_duplicates(templates: list[dict]) -> dict[str, list[str]]:
    seen = defaultdict(list)
    for t in templates:
        seen[t["id"]].append(t["_source_file"])
    return {k: v for k, v in seen.items() if len(v) > 1}


def per_skill_summary(audits: list[dict], skills: dict) -> dict:
    by_skill: dict[str, dict] = {}
    for sid, meta in skills.items():
        by_skill[sid] = {
            "id": sid,
            "label": meta["label"],
            "grade": meta["grade"],
            "templates": [],
            "difficulty_tiers": set(),
            "total_variants": 0,
            "input_types": set(),
            "any_broken": False,
            "worst_degenerate_rate": 0.0,
        }
    for a in audits:
        sid = a["skill_id"]
        if sid and sid in by_skill:
            slot = by_skill[sid]
            slot["templates"].append(a["id"])
            slot["difficulty_tiers"].add(a["difficulty"])
            slot["total_variants"] += a["variant_count"]
            slot["input_types"].add(a["input_type"] or "?")
            if a["generator_error"] or a["successful_samples"] < SAMPLE_N * 0.5:
                slot["any_broken"] = True
            slot["worst_degenerate_rate"] = max(slot["worst_degenerate_rate"], a["degenerate_rate"])

    # finalize sets → lists
    for s in by_skill.values():
        s["difficulty_tiers"] = sorted(s["difficulty_tiers"])
        s["input_types"] = sorted(s["input_types"])
        s["template_count"] = len(s["templates"])
        s["missing_tiers"] = sorted({1, 2, 3} - set(s["difficulty_tiers"]))
        s["status"] = classify_skill(s)
    return by_skill


def classify_skill(s: dict) -> str:
    if s["template_count"] == 0:
        return "no_coverage"
    if s["any_broken"]:
        return "broken"
    if s["total_variants"] < 20:
        return "thin"
    if s["worst_degenerate_rate"] > 0.10:
        return "degenerate_heavy"
    if 1 not in s["difficulty_tiers"]:
        return "no_easy_tier"
    if len(s["difficulty_tiers"]) == 1:
        return "single_tier"
    return "ok"


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main() -> int:
    templates = load_all_templates()
    skills = load_skills()
    print(f"Loaded {len(templates)} templates across {len(TEMPLATE_FILES)} files.")
    print(f"Loaded {len(skills)} skills.")

    duplicates = find_duplicates(templates)
    if duplicates:
        print(f"\nDUPLICATE IDs: {len(duplicates)}")
        for k, v in duplicates.items():
            print(f"  {k} in {v}")

    audits = []
    for i, t in enumerate(templates):
        try:
            a = audit_template(t)
        except Exception:
            traceback.print_exc()
            a = {
                "id": t["id"],
                "skill_id": t.get("skill_id"),
                "difficulty": t.get("difficulty"),
                "source_file": t["_source_file"],
                "fatal_error": traceback.format_exc().splitlines()[-1],
            }
        audits.append(a)
        if (i + 1) % 20 == 0:
            print(f"  audited {i + 1}/{len(templates)}")

    skill_summary = per_skill_summary(audits, skills)

    # Global counters
    total_variants = sum(a.get("variant_count", 0) for a in audits)
    broken = [a for a in audits if a.get("generator_error") or a.get("fatal_error")]
    degenerate_heavy = [a for a in audits if a.get("degenerate_rate", 0) > 0.10]
    low_variety = [a for a in audits if 0 < a.get("variant_count", 0) < 20]
    render_problems = [a for a in audits if a.get("render_issues")]
    mcq_problems = [a for a in audits if a.get("mcq_issues")]
    typo_problems = [a for a in audits if a.get("typography_issues")]

    result = {
        "meta": {
            "sample_n": SAMPLE_N,
            "seed": SEED,
            "n_templates": len(templates),
            "n_skills": len(skills),
            "total_variants": total_variants,
        },
        "duplicates": duplicates,
        "counts": {
            "broken": len(broken),
            "degenerate_heavy": len(degenerate_heavy),
            "low_variety": len(low_variety),
            "render_problems": len(render_problems),
            "mcq_problems": len(mcq_problems),
            "typography_problems": len(typo_problems),
        },
        "audits": audits,
        "skills": skill_summary,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(result, indent=2, ensure_ascii=False, default=str))
    print(f"\nWrote {OUT}")
    print(f"Total variants (sum over templates): {total_variants}")
    print(f"Broken: {len(broken)}  degenerate-heavy: {len(degenerate_heavy)}  low-variety: {len(low_variety)}")
    print(f"Render issues: {len(render_problems)}  MCQ issues: {len(mcq_problems)}  Typography: {len(typo_problems)}")
    skill_status = Counter(s["status"] for s in skill_summary.values())
    print(f"Skill status: {dict(skill_status)}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
