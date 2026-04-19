from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.sessions.models import Session
from apps.students.models import Student

from .drill import DRILL_LENGTH, NoDrillSkill, generate_drill_exercise
from .models import Attempt
from .serializers import GeneratedExerciseSerializer


def _get_session(request, session_id: str) -> Session:
    return get_object_or_404(
        Session.objects.select_related("student"),
        id=session_id,
        student__user=request.user,
        mode="drill",
    )


def _build_question(session: Session) -> dict | None:
    answered = Attempt.objects.filter(session=session).count()
    if answered >= DRILL_LENGTH:
        return None
    try:
        payload = generate_drill_exercise(session.student)
    except NoDrillSkill:
        return None
    return {
        "index": answered,
        "total": DRILL_LENGTH,
        "skill": {
            "id": payload["skill_id"],
            "label": payload.get("skill_label"),
            "grade": payload.get("skill_grade"),
        },
        "difficulty": payload["difficulty"],
        "exercise": GeneratedExerciseSerializer(payload).data,
    }


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def start(request):
    student_id = request.data.get("student_id")
    if not student_id:
        raise ValidationError({"student_id": "required"})
    student = get_object_or_404(Student, id=student_id, user=request.user)
    session = Session.objects.create(student=student, mode="drill")
    question = _build_question(session)
    return Response(
        {
            "session_id": str(session.id),
            "student_id": str(student.id),
            "length": DRILL_LENGTH,
            "question": question,
        },
        status=201,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def next_question(request, session_id):
    session = _get_session(request, session_id)
    answered = Attempt.objects.filter(session=session).count()
    question = _build_question(session)
    if question is None:
        if session.ended_at is None:
            session.ended_at = timezone.now()
            session.save(update_fields=["ended_at"])
        return Response({"done": True, "answered": answered, "summary": _summary(session)})
    return Response({"done": False, "answered": answered, "question": question})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def result(request, session_id):
    session = _get_session(request, session_id)
    return Response(_summary(session))


def _summary(session: Session) -> dict:
    attempts = list(Attempt.objects.filter(session=session).select_related("template"))
    total = len(attempts)
    correct = sum(1 for a in attempts if a.is_correct)
    streak = 0
    best_streak = 0
    for a in attempts:
        if a.is_correct:
            streak += 1
            best_streak = max(best_streak, streak)
        else:
            streak = 0
    return {
        "session_id": str(session.id),
        "total_attempts": total,
        "correct": correct,
        "accuracy": round(correct / total, 2) if total else 0.0,
        "best_streak": best_streak,
        "ended_at": session.ended_at.isoformat() if session.ended_at else None,
    }
