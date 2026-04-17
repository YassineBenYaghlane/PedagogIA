import json

from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from apps.common.permissions import IsOwner
from apps.exercises.serializers import AttemptCreateSerializer, AttemptReadSerializer
from apps.exercises.services import record_attempt
from apps.students.models import Student

from .exports import build_diagnostic_pdf, session_summaries
from .models import Session
from .serializers import SessionSerializer


class SessionViewSet(ModelViewSet):
    serializer_class = SessionSerializer
    permission_classes = [IsOwner]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Session.objects.none()
        return Session.objects.filter(student__user=user).select_related("student")

    def list(self, request, *args, **kwargs):
        if request.query_params.get("summary") in ("1", "true", "yes"):
            student_id = request.query_params.get("student")
            if not student_id:
                return Response({"detail": "student is required"}, status=400)
            student = get_object_or_404(Student, id=student_id, user=request.user)
            return Response(session_summaries(student))
        return super().list(request, *args, **kwargs)

    @action(detail=True, methods=["get"], url_path="export.json")
    def export_json(self, request, pk=None):
        session = self.get_object()
        attempts = session.attempts.select_related("skill", "template").order_by("responded_at")
        payload = {
            "session": {
                "id": str(session.id),
                "mode": session.mode,
                "student_id": str(session.student_id),
                "student_name": session.student.display_name,
                "started_at": session.started_at.isoformat() if session.started_at else None,
                "ended_at": session.ended_at.isoformat() if session.ended_at else None,
            },
            "attempts": AttemptReadSerializer(attempts, many=True).data,
        }
        body = json.dumps(payload, ensure_ascii=False, indent=2, default=str).encode("utf-8")
        filename = f"session-{session.mode}-{session.started_at.date()}.json"
        resp = HttpResponse(body, content_type="application/json; charset=utf-8")
        resp["Content-Disposition"] = f'attachment; filename="{filename}"'
        return resp

    @action(detail=True, methods=["get"], url_path="diagnostic.pdf")
    def diagnostic_pdf(self, request, pk=None):
        session = self.get_object()
        if session.mode != "diagnostic":
            return Response({"detail": "not a diagnostic session"}, status=400)
        pdf_bytes = build_diagnostic_pdf(session)
        filename = f"diagnostic-{session.student.display_name}-{session.started_at.date()}.pdf"
        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response

    @action(detail=True, methods=["get", "post"], url_path="attempts")
    def attempts(self, request, pk=None):
        session = self.get_object()
        if request.method == "GET":
            qs = session.attempts.all()
            return Response(AttemptReadSerializer(qs, many=True).data)

        serializer = AttemptCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            attempt, gamification = record_attempt(session=session, **serializer.validated_data)
        except Exception as exc:
            return Response({"signature": str(exc)}, status=400)
        if session.mode == "drill":
            msg = (
                "Bravo, rapide !"
                if attempt.is_correct
                else f"Non, c'était {attempt.correct_answer}."
            )
        elif session.mode == "diagnostic":
            msg = "Bravo !" if attempt.is_correct else "Réponse notée."
        elif session.mode == "exam":
            msg = "Réponse enregistrée."
        else:
            msg = "Bravo !" if attempt.is_correct else "Pas tout à fait."
        feedback = {
            "is_correct": attempt.is_correct,
            "message": msg,
            "next_action": "practice",
            "next_skill_id": None,
            "can_explain": not attempt.is_correct and session.mode == "learn",
        }
        return Response(
            {
                "attempt": AttemptReadSerializer(attempt).data,
                "feedback": feedback,
                "gamification": gamification,
            },
            status=201,
        )
