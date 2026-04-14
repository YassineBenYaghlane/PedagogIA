from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

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
