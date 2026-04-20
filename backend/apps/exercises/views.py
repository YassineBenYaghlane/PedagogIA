from django.conf import settings
from django.core import signing
from django.http import Http404
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.skills.models import Skill
from apps.students.models import Student, StudentSkillState
from apps.students.services import NoSkillAvailable, difficulty_for_xp, pick_next_skill
from src.services.exercise_gen import instantiate

from .investigation import feedback_for
from .models import INPUT_TYPES, Attempt, ExerciseTemplate
from .serializers import GeneratedExerciseSerializer
from .services import ANSWER_SALT, generate_exercise


def _difficulty_for_skill(student: Student, skill: Skill) -> int:
    state = StudentSkillState.objects.filter(student=student, skill=skill).first()
    return difficulty_for_xp(state.skill_xp if state else 0.0)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def generate(request):
    skill_id = request.query_params.get("skill_id")
    difficulty = request.query_params.get("difficulty", "1")
    if not skill_id:
        raise ValidationError({"skill_id": "required"})
    try:
        difficulty_int = int(difficulty)
    except ValueError as exc:
        raise ValidationError({"difficulty": "must be an integer"}) from exc
    try:
        payload = generate_exercise(skill_id, difficulty_int)
    except ExerciseTemplate.DoesNotExist as exc:
        raise ValidationError({"detail": str(exc)}) from exc
    return Response(GeneratedExerciseSerializer(payload).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def next_exercise(request):
    student_id = request.query_params.get("student_id")
    if not student_id:
        raise ValidationError({"student_id": "required"})
    try:
        student = get_object_or_404(Student, id=student_id, user=request.user)
    except (ValueError, Student.DoesNotExist) as exc:
        raise Http404 from exc
    override_skill_id = request.query_params.get("skill_id")
    if override_skill_id:
        skill = Skill.objects.filter(id=override_skill_id).first()
        if skill is None or not ExerciseTemplate.objects.filter(skills=skill).exists():
            raise ValidationError({"skill_id": "unknown or has no templates"})
        difficulty = _difficulty_for_skill(student, skill)
    else:
        try:
            skill, difficulty = pick_next_skill(student)
        except NoSkillAvailable as exc:
            return Response({"detail": str(exc)}, status=404)
    payload = generate_exercise(skill.id, difficulty)
    return Response(
        {
            "student_id": str(student.id),
            "skill": {"id": skill.id, "label": skill.label, "grade": skill.grade},
            "exercise": GeneratedExerciseSerializer(payload).data,
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def samples(request):
    """Debug-only: one generated exercise per input_type, with a valid signature."""
    if not settings.DEBUG and not request.user.is_staff:
        raise Http404
    out = []
    for input_type, _ in INPUT_TYPES:
        tpl = ExerciseTemplate.objects.filter(input_type=input_type).order_by("?").first()
        if tpl is None:
            continue
        try:
            generated = instantiate(tpl.template)
        except Exception:
            continue
        first_skill = tpl.skills.first()
        first_skill_id = first_skill.id if first_skill else ""
        signature = signing.dumps(
            {
                "template_id": tpl.id,
                "skill_id": first_skill_id,
                "input_type": tpl.input_type,
                "params": generated["params"],
                "answer": generated["answer"],
            },
            salt=ANSWER_SALT,
        )
        out.append(
            {
                "template_id": tpl.id,
                "skill_id": first_skill_id,
                "difficulty": tpl.difficulty,
                "type": tpl.template.get("type"),
                "input_type": tpl.input_type,
                "prompt": generated["prompt"],
                "params": generated["params"],
                "signature": signature,
                "answer": generated["answer"],
            }
        )
    return Response(out)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def explain_attempt(request, attempt_id):
    """On-demand AI investigation for a wrong attempt the user owns."""
    attempt = get_object_or_404(
        Attempt.objects.select_related("session__student", "template"),
        id=attempt_id,
        session__student__user=request.user,
    )
    if attempt.is_correct:
        raise ValidationError({"detail": "explanation only available for wrong attempts"})
    return Response(feedback_for(attempt))
