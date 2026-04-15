from django.http import HttpResponse, JsonResponse
from rest_framework.decorators import action
from rest_framework.viewsets import ModelViewSet

from apps.common.permissions import IsOwner

from .exports import build_json_payload, render_pdf_bytes
from .models import Student
from .serializers import StudentSerializer


class StudentViewSet(ModelViewSet):
    serializer_class = StudentSerializer
    permission_classes = [IsOwner]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Student.objects.none()
        return Student.objects.filter(user=user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["get"], url_path="export.json")
    def export_json(self, request, pk=None):
        student = self.get_object()
        payload = build_json_payload(student, request)
        response = JsonResponse(payload, json_dumps_params={"ensure_ascii": False, "indent": 2})
        response["Content-Disposition"] = (
            f'attachment; filename="pedagogia-{student.display_name}-{student.id}.json"'
        )
        return response

    @action(detail=True, methods=["get"], url_path="export.pdf")
    def export_pdf(self, request, pk=None):
        student = self.get_object()
        pdf = render_pdf_bytes(student)
        response = HttpResponse(pdf, content_type="application/pdf")
        response["Content-Disposition"] = (
            f'attachment; filename="pedagogia-{student.display_name}-{student.id}.pdf"'
        )
        return response
