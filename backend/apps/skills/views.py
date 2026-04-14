from rest_framework.permissions import AllowAny
from rest_framework.viewsets import ReadOnlyModelViewSet

from .models import Skill
from .serializers import SkillSerializer


class SkillViewSet(ReadOnlyModelViewSet):
    queryset = Skill.objects.prefetch_related("prerequisite_links").all()
    serializer_class = SkillSerializer
    permission_classes = [AllowAny]
    lookup_value_regex = "[^/]+"
