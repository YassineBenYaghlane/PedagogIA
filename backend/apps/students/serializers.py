from django.db.models import Count
from rest_framework import serializers

from .models import Student, StudentSkillState


def mastery_counts(student: Student) -> dict:
    rows = (
        StudentSkillState.objects.filter(student=student).values("status").annotate(n=Count("id"))
    )
    out = {choice: 0 for choice, _ in StudentSkillState.STATUS_CHOICES}
    for row in rows:
        out[row["status"]] = row["n"]
    return out


class StudentNestedSerializer(serializers.ModelSerializer):
    mastery_summary = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = ("id", "display_name", "grade", "created_at", "mastery_summary")
        read_only_fields = ("id", "created_at", "mastery_summary")

    def get_mastery_summary(self, obj: Student) -> dict:
        return mastery_counts(obj)


class StudentSerializer(serializers.ModelSerializer):
    mastery_summary = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = ("id", "display_name", "grade", "created_at", "mastery_summary")
        read_only_fields = ("id", "created_at", "mastery_summary")

    def get_mastery_summary(self, obj: Student) -> dict:
        return mastery_counts(obj)


class StudentSkillStateSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentSkillState
        fields = (
            "student",
            "skill",
            "mastery_level",
            "consecutive_correct",
            "total_attempts",
            "last_practiced_at",
            "updated_at",
        )
        read_only_fields = fields
