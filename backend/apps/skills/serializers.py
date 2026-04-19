from rest_framework import serializers

from .models import Skill


class SkillSerializer(serializers.ModelSerializer):
    prerequisite_ids = serializers.SerializerMethodField()

    class Meta:
        model = Skill
        fields = ("id", "label", "grade", "description", "prerequisite_ids")

    def get_prerequisite_ids(self, obj: Skill) -> list[str]:
        return [link.prerequisite_id for link in obj.prerequisite_links.all()]
