from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from apps.common.permissions import IsOwner
from apps.skills.models import Skill

from .models import Student, StudentSkillState
from .serializers import StudentSerializer
from .services.grade_seeding import seed_prior_grade_mastery


class StudentViewSet(ModelViewSet):
    serializer_class = StudentSerializer
    permission_classes = [IsOwner]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Student.objects.none()
        return Student.objects.filter(user=user)

    def perform_create(self, serializer):
        student = serializer.save(user=self.request.user)
        seed_prior_grade_mastery(student)

    @action(detail=True, methods=["get"], url_path="skill-tree")
    def skill_tree(self, request, pk=None):
        """Per-skill mastery snapshot for this student (one row per seeded skill)."""
        student = self.get_object()
        skills = Skill.objects.only("id").order_by("id")
        states = {s.skill_id: s for s in StudentSkillState.objects.filter(student=student)}
        payload = []
        for skill in skills:
            state = states.get(skill.id)
            payload.append(
                {
                    "skill_id": skill.id,
                    "status": state.status if state else StudentSkillState.NOT_STARTED,
                    "mastery_level": state.mastery_level if state else 0.0,
                    "total_attempts": state.total_attempts if state else 0,
                    "consecutive_correct": state.consecutive_correct if state else 0,
                    "last_practiced_at": state.last_practiced_at if state else None,
                    "next_review_at": state.next_review_at if state else None,
                }
            )
        return Response(payload)
