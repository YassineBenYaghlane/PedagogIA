"""Dev-only endpoints powering the Atelier (skill-health dashboard + playground)."""

from __future__ import annotations

import json
from collections import defaultdict
from pathlib import Path

from django.conf import settings
from django.http import Http404
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.skills.models import Skill
from src.services.exercise_gen import instantiate

from .models import ExerciseTemplate

AUDIT_PATH = Path(settings.BASE_DIR).parent / "artifacts/audit/combined.json"


def _require_dev(request) -> None:
    if settings.ENVIRONMENT != "dev" and not request.user.is_staff:
        raise Http404


def _load_audit() -> dict | None:
    if not AUDIT_PATH.exists():
        return None
    try:
        return json.loads(AUDIT_PATH.read_text())
    except (OSError, json.JSONDecodeError):
        return None


def _live_skills_payload() -> dict:
    """Fallback payload built from DB when audit artifacts are absent."""
    skills = {s.id: s for s in Skill.objects.all()}
    buckets: dict[str, dict] = {}
    for sid, skill in skills.items():
        buckets[sid] = {
            "id": sid,
            "label": skill.label,
            "grade": skill.grade,
            "template_count": 0,
            "total_variants": 0,
            "difficulty_tiers": [],
            "input_types": [],
            "avg_score": None,
            "status": "no_coverage",
            "templates": [],
        }
    templates = ExerciseTemplate.objects.prefetch_related("skills").all()
    per_skill_tiers: dict[str, set[int]] = defaultdict(set)
    per_skill_inputs: dict[str, set[str]] = defaultdict(set)
    for tpl in templates:
        for skill in tpl.skills.all():
            bucket = buckets.get(skill.id)
            if bucket is None:
                continue
            bucket["template_count"] += 1
            per_skill_tiers[skill.id].add(tpl.difficulty)
            per_skill_inputs[skill.id].add(tpl.input_type)
            bucket["templates"].append(
                {
                    "id": tpl.id,
                    "difficulty": tpl.difficulty,
                    "input_type": tpl.input_type,
                    "template_type": tpl.template.get("type", ""),
                    "variant_count": None,
                    "score": None,
                    "score_reasons": [],
                    "sample_prompts": [],
                }
            )
    for sid, bucket in buckets.items():
        bucket["difficulty_tiers"] = sorted(per_skill_tiers[sid])
        bucket["input_types"] = sorted(per_skill_inputs[sid])
        if bucket["template_count"] == 0:
            bucket["status"] = "no_coverage"
        elif len(bucket["difficulty_tiers"]) == 1:
            bucket["status"] = "single_tier"
        else:
            bucket["status"] = "ok"
    return {
        "meta": {"source": "live", "n_skills": len(buckets), "n_templates": templates.count()},
        "skills": buckets,
    }


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def audit(request):
    """Skill-health snapshot for the Atelier dashboard (dev-only)."""
    _require_dev(request)
    data = _load_audit()
    if data is None:
        return Response(_live_skills_payload())
    return Response(
        {
            "meta": {**data.get("meta", {}), "source": "audit_artifact"},
            "skills": data["skills"],
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def skill_detail(request, skill_id: str):
    """Per-skill detail: skill + every template + audit info (when available)."""
    _require_dev(request)
    skill = get_object_or_404(Skill, id=skill_id)
    templates = (
        ExerciseTemplate.objects.filter(skills=skill)
        .prefetch_related("skills")
        .order_by("difficulty", "id")
    )
    audit_data = _load_audit() or {}
    audit_templates = audit_data.get("templates", {})
    audit_skill = audit_data.get("skills", {}).get(skill_id, {})

    out_templates = []
    for tpl in templates:
        audit_tpl = audit_templates.get(tpl.id, {})
        out_templates.append(
            {
                "id": tpl.id,
                "difficulty": tpl.difficulty,
                "input_type": tpl.input_type,
                "template_type": tpl.template.get("type", ""),
                "operation": tpl.template.get("operation"),
                "prompt_template": tpl.template.get("prompt_template", ""),
                "params": tpl.template.get("params", {}),
                "variant_count": audit_tpl.get("variant_count"),
                "score": audit_tpl.get("score"),
                "score_reasons": audit_tpl.get("score_reasons", []),
                "flags": audit_tpl.get("flags", {}),
                "sample_prompts": audit_tpl.get("sample_prompts", []),
                "sample_answers": audit_tpl.get("sample_answers", []),
            }
        )

    return Response(
        {
            "skill": {"id": skill.id, "label": skill.label, "grade": skill.grade},
            "summary": {
                "template_count": len(out_templates),
                "total_variants": audit_skill.get("total_variants"),
                "difficulty_tiers": audit_skill.get(
                    "difficulty_tiers", sorted({t.difficulty for t in templates})
                ),
                "input_types": audit_skill.get(
                    "input_types", sorted({t.input_type for t in templates})
                ),
                "avg_score": audit_skill.get("avg_score"),
                "status": audit_skill.get("status"),
            },
            "templates": out_templates,
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def template_preview(request, template_id: str):
    """Generate a concrete preview for a specific template (dev-only playground)."""
    _require_dev(request)
    tpl = get_object_or_404(ExerciseTemplate.objects.prefetch_related("skills"), id=template_id)
    try:
        generated = instantiate(tpl.template)
    except Exception as exc:  # noqa: BLE001 — surface generator error verbatim
        return Response(
            {"template_id": tpl.id, "error": f"{type(exc).__name__}: {exc}"},
            status=200,
        )
    first_skill = tpl.skills.first()
    return Response(
        {
            "template_id": tpl.id,
            "skill_id": first_skill.id if first_skill else "",
            "difficulty": tpl.difficulty,
            "input_type": tpl.input_type,
            "type": tpl.template.get("type", ""),
            "prompt": generated["prompt"],
            "answer": generated["answer"],
            "params": generated["params"],
        }
    )
