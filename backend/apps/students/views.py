from rest_framework.viewsets import ModelViewSet

from apps.common.permissions import IsOwnerParent

from .models import Student
from .serializers import StudentSerializer


class StudentViewSet(ModelViewSet):
    serializer_class = StudentSerializer
    permission_classes = [IsOwnerParent]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Student.objects.none()
        return Student.objects.filter(parent=user)

    def perform_create(self, serializer):
        serializer.save(parent=self.request.user)
