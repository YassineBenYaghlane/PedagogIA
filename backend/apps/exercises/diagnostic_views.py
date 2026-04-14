from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.sessions.models import Session
from apps.students.models import Student

from .diagnostic import DIAGNOSTIC_LENGTH, build_plan, build_result, get_exercise_for_slot
from .models import Attempt
from .serializers import GeneratedExerciseSerializer


def _get_session(request, session_id: str) -> Session:
    return get_object_or_404(
        Session.objects.select_related("student"),
        id=session_id,
        student__parent=request.user,
        mode="diagnostic",
    )


def _nth_question(session: Session, index: int) -> dict | None:
    plan = build_plan(session.student, session.id)
    if index >= len(plan) or index >= DIAGNOSTIC_LENGTH:
        return None
    slot = plan[index]
    exercise = get_exercise_for_slot(slot)
    return {
        "index": index,
        "total": min(DIAGNOSTIC_LENGTH, len(plan)),
        "skill": {"id": slot.skill_id},
        "exercise": GeneratedExerciseSerializer(exercise).data,
    }


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def start(request):
    student_id = request.data.get("student_id")
    if not student_id:
        raise ValidationError({"student_id": "required"})
    student = get_object_or_404(Student, id=student_id, parent=request.user)
    session = Session.objects.create(student=student, mode="diagnostic")
    question = _nth_question(session, 0)
    return Response(
        {
            "session_id": str(session.id),
            "student_id": str(student.id),
            "length": question["total"] if question else 0,
            "question": question,
        },
        status=201,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def next_question(request, session_id):
    session = _get_session(request, session_id)
    answered = Attempt.objects.filter(session=session).count()
    question = _nth_question(session, answered)
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
