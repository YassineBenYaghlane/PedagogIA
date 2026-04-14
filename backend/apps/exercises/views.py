from django.http import Http404
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.students.models import Student
from apps.students.services import NoSkillAvailable, pick_next_skill

from .models import ExerciseTemplate
from .serializers import GeneratedExerciseSerializer
from .services import generate_exercise


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
        student = get_object_or_404(Student, id=student_id, parent=request.user)
    except (ValueError, Student.DoesNotExist) as exc:
        raise Http404 from exc
    try:
        skill, difficulty = pick_next_skill(student)
    except NoSkillAvailable as exc:
        return Response({"detail": str(exc)}, status=204)
    payload = generate_exercise(skill.id, difficulty)
    return Response(
        {
            "student_id": str(student.id),
            "skill": {"id": skill.id, "label": skill.label, "grade": skill.grade},
            "exercise": GeneratedExerciseSerializer(payload).data,
        }
    )
