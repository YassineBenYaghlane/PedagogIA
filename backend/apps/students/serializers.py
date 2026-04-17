from django.db.models import Count
from rest_framework import serializers

from apps.students.services.achievements import serialize_badge
from apps.students.services.streaks import daily_progress

from .models import GRADE_VALUES, Student, StudentAchievement, StudentSkillState


def mastery_counts(student: Student) -> dict:
    rows = (
        StudentSkillState.objects.filter(student=student).values("status").annotate(n=Count("id"))
    )
    out = {choice: 0 for choice, _ in StudentSkillState.STATUS_CHOICES}
    for row in rows:
        out[row["status"]] = row["n"]
    return out


class StudentAchievementSerializer(serializers.ModelSerializer):
    label = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    icon = serializers.SerializerMethodField()
    tier = serializers.SerializerMethodField()

    class Meta:
        model = StudentAchievement
        fields = ("code", "label", "description", "icon", "tier", "earned_at")

    def _badge(self, obj):
        return serialize_badge(obj.code)

    def get_label(self, obj):
        return self._badge(obj).get("label", obj.code)

    def get_description(self, obj):
        return self._badge(obj).get("description", "")

    def get_icon(self, obj):
        return self._badge(obj).get("icon", "sigma")

    def get_tier(self, obj):
        return self._badge(obj).get("tier", "bronze")


GAMIFICATION_FIELDS = (
    "xp",
    "rank",
    "current_streak",
    "best_streak",
    "daily_goal",
    "daily_progress",
    "achievements",
)


class _StudentBase(serializers.ModelSerializer):
    mastery_summary = serializers.SerializerMethodField()
    daily_progress = serializers.SerializerMethodField()
    achievements = StudentAchievementSerializer(many=True, read_only=True)

    def get_mastery_summary(self, obj: Student) -> dict:
        return mastery_counts(obj)

    def get_daily_progress(self, obj: Student) -> int:
        return daily_progress(obj)

    def validate_grade(self, value: str) -> str:
        if value not in GRADE_VALUES:
            raise serializers.ValidationError(f"grade must be one of {', '.join(GRADE_VALUES)}")
        return value


class StudentNestedSerializer(_StudentBase):
    class Meta:
        model = Student
        fields = (
            "id",
            "display_name",
            "grade",
            "created_at",
            "mastery_summary",
            *GAMIFICATION_FIELDS,
        )
        read_only_fields = ("id", "created_at", "mastery_summary", *GAMIFICATION_FIELDS)


class StudentSerializer(_StudentBase):
    class Meta:
        model = Student
        fields = (
            "id",
            "display_name",
            "grade",
            "created_at",
            "mastery_summary",
            *GAMIFICATION_FIELDS,
        )
        read_only_fields = ("id", "created_at", "mastery_summary", *GAMIFICATION_FIELDS)


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
