from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.sessions.models import Session
from apps.students.models import Student

from .diagnostic import (
    DIAGNOSTIC_LENGTH,
    build_result,
    get_exercise_for_slot,
    select_next_slot,
)
from .models import Attempt
from .serializers import GeneratedExerciseSerializer


def _get_session(request, session_id: str) -> Session:
    return get_object_or_404(
        Session.objects.select_related("student"),
        id=session_id,
        student__user=request.user,
        mode="diagnostic",
    )


def _build_question(session: Session) -> dict | None:
    attempts = list(
        Attempt.objects.filter(session=session).select_related("skill").order_by("responded_at")
    )
    slot = select_next_slot(session.student, attempts)
    if slot is None:
        return None
    exercise = get_exercise_for_slot(slot)
    return {
        "index": len(attempts),
        "total": DIAGNOSTIC_LENGTH,
        "skill": {"id": slot.skill_id},
        "difficulty": slot.difficulty,
        "exercise": GeneratedExerciseSerializer(exercise).data,
    }


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def start(request):
    student_id = request.data.get("student_id")
    if not student_id:
        raise ValidationError({"student_id": "required"})
    student = get_object_or_404(Student, id=student_id, user=request.user)
    session = Session.objects.create(student=student, mode="diagnostic")
    question = _build_question(session)
    return Response(
        {
            "session_id": str(session.id),
            "student_id": str(student.id),
            "length": DIAGNOSTIC_LENGTH,
            "question": question,
        },
        status=201,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def next_question(request, session_id):
    session = _get_session(request, session_id)
    question = _build_question(session)
    answered = Attempt.objects.filter(session=session).count()
    if question is None:
        if session.ended_at is None:
            session.ended_at = timezone.now()
            session.save(update_fields=["ended_at"])
        return Response({"done": True, "answered": answered})
    return Response({"done": False, "answered": answered, "question": question})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def result(request, session_id):
    session = _get_session(request, session_id)
    return Response(build_result(session))
