from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from apps.common.permissions import IsOwnerParent
from apps.exercises.investigation import feedback_for
from apps.exercises.serializers import AttemptCreateSerializer, AttemptReadSerializer
from apps.exercises.services import record_attempt

from .models import Session
from .serializers import SessionSerializer


class SessionViewSet(ModelViewSet):
    serializer_class = SessionSerializer
    permission_classes = [IsOwnerParent]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Session.objects.none()
        return Session.objects.filter(student__parent=user).select_related("student")

    @action(detail=True, methods=["get", "post"], url_path="attempts")
    def attempts(self, request, pk=None):
        session = self.get_object()
        if request.method == "GET":
            qs = session.attempts.all()
            return Response(AttemptReadSerializer(qs, many=True).data)

        serializer = AttemptCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            attempt = record_attempt(session=session, **serializer.validated_data)
        except Exception as exc:
            return Response({"signature": str(exc)}, status=400)
        return Response(
            {
                "attempt": AttemptReadSerializer(attempt).data,
                "feedback": feedback_for(attempt),
            },
            status=201,
        )
