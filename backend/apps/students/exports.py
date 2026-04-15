from django.db.models import Count, Prefetch, Q
from django.template.loader import render_to_string

from apps.exercises.models import Attempt
from apps.exercises.serializers import AttemptReadSerializer
from apps.sessions.models import Session
from apps.sessions.serializers import SessionSummarySerializer

from .models import Student
from .serializers import StudentSerializer, mastery_counts


def _summary_queryset(student: Student):
    return (
        Session.objects.filter(student=student)
        .annotate(
            attempt_count=Count("attempts"),
            correct_count=Count("attempts", filter=Q(attempts__is_correct=True)),
        )
        .prefetch_related(Prefetch("attempts", queryset=Attempt.objects.select_related("skill")))
    )


def build_json_payload(student: Student, request) -> dict:
    sessions = _summary_queryset(student)
    attempts = Attempt.objects.filter(session__student=student).select_related("skill")
    return {
        "student": StudentSerializer(student, context={"request": request}).data,
        "sessions": SessionSummarySerializer(sessions, many=True).data,
        "attempts": AttemptReadSerializer(attempts, many=True).data,
    }


def render_pdf_bytes(student: Student) -> bytes:
    from weasyprint import HTML

    sessions = list(_summary_queryset(student)[:30])
    context = {
        "student": student,
        "mastery": mastery_counts(student),
        "sessions": SessionSummarySerializer(sessions, many=True).data,
        "achievements": list(student.achievements.all()),
    }
    html = render_to_string("exports/student_summary.html", context)
    return HTML(string=html).write_pdf()
