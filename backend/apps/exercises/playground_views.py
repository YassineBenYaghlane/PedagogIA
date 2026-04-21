from django.conf import settings
from django.http import Http404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from src.services.exercise_gen import instantiate

from .models import INPUT_TYPES, ExerciseTemplate


def _playground_allowed(request) -> bool:
    return settings.ENVIRONMENT == "dev"


def _serialize_template(tpl: ExerciseTemplate) -> dict:
    skills = list(tpl.skills.all())
    skill_ids = [s.id for s in skills]
    grades = sorted({s.grade for s in skills if s.grade})
    return {
        "id": tpl.id,
        "skill_ids": skill_ids,
        "grades": grades,
        "difficulty": tpl.difficulty,
        "input_type": tpl.input_type,
        "type": tpl.template.get("type"),
        "template": tpl.template,
    }


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def playground_templates(request):
    """List every exercise template with filters. Dev/staff only."""
    if not _playground_allowed(request):
        raise Http404
    qs = ExerciseTemplate.objects.prefetch_related("skills").all()

    grade = request.query_params.get("grade")
    if grade:
        qs = qs.filter(skills__grade=grade).distinct()

    skill_id = request.query_params.get("skill_id")
    if skill_id:
        qs = qs.filter(skills__id=skill_id).distinct()

    input_type = request.query_params.get("input_type")
    if input_type:
        valid = {it for it, _ in INPUT_TYPES}
        if input_type not in valid:
            raise ValidationError({"input_type": f"must be one of {sorted(valid)}"})
        qs = qs.filter(input_type=input_type)

    difficulty = request.query_params.get("difficulty")
    if difficulty:
        try:
            qs = qs.filter(difficulty=int(difficulty))
        except ValueError as exc:
            raise ValidationError({"difficulty": "must be an integer"}) from exc

    return Response([_serialize_template(t) for t in qs])


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def playground_instantiate(request):
    """Instantiate a template, optionally with a flat params override. Dev/staff only."""
    if not _playground_allowed(request):
        raise Http404
    template_id = request.data.get("template_id")
    if not template_id:
        raise ValidationError({"template_id": "required"})
    try:
        tpl = ExerciseTemplate.objects.prefetch_related("skills").get(id=template_id)
    except ExerciseTemplate.DoesNotExist as exc:
        raise NotFound({"template_id": f"unknown: {template_id}"}) from exc

    override = request.data.get("params_override") or {}
    if not isinstance(override, dict):
        raise ValidationError({"params_override": "must be an object"})

    template_dict = {**tpl.template}
    merged_params = {**(template_dict.get("params") or {}), **override}
    template_dict["params"] = merged_params

    try:
        generated = instantiate(template_dict)
    except (RuntimeError, KeyError, ValueError, TypeError) as exc:
        raise ValidationError({"detail": f"instantiation failed: {exc}"}) from exc

    skills = list(tpl.skills.all())
    return Response(
        {
            "template_id": tpl.id,
            "skill_ids": [s.id for s in skills],
            "grades": sorted({s.grade for s in skills if s.grade}),
            "difficulty": tpl.difficulty,
            "type": template_dict.get("type"),
            "input_type": tpl.input_type,
            "prompt": generated["prompt"],
            "params": generated["params"],
            "answer": generated["answer"],
            "effective_template_params": merged_params,
        }
    )
