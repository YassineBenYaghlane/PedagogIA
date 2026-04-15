from django.db.models import Count, Prefetch, Q
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from apps.common.permissions import IsOwner
from apps.exercises.models import Attempt
from apps.exercises.serializers import AttemptCreateSerializer, AttemptReadSerializer
from apps.exercises.services import record_attempt

from .models import Session
from .serializers import SessionSerializer, SessionSummarySerializer


class SessionViewSet(ModelViewSet):
    serializer_class = SessionSerializer
    permission_classes = [IsOwner]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Session.objects.none()
        qs = Session.objects.filter(student__user=user).select_related("student")
        student_id = self.request.query_params.get("student")
        if student_id:
            qs = qs.filter(student_id=student_id)
        return qs

    def get_serializer_class(self):
        if self.action == "list" and self.request.query_params.get("summary") == "1":
            return SessionSummarySerializer
        return super().get_serializer_class()

    def list(self, request, *args, **kwargs):
        if request.query_params.get("summary") != "1":
            return super().list(request, *args, **kwargs)
        qs = (
            self.get_queryset()
            .annotate(
                attempt_count=Count("attempts"),
                correct_count=Count("attempts", filter=Q(attempts__is_correct=True)),
            )
            .prefetch_related(
                Prefetch("attempts", queryset=Attempt.objects.select_related("skill"))
            )
        )
        page = self.paginate_queryset(qs)
        target = page if page is not None else qs
        data = SessionSummarySerializer(target, many=True).data
        if page is not None:
            return self.get_paginated_response(data)
        return Response(data)

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
