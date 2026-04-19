from rest_framework import serializers

from apps.students.services.achievements import serialize_badge
from apps.students.services.streaks import daily_progress

from .models import GRADE_VALUES, Student, StudentAchievement, StudentSkillState


def mastery_counts(student: Student) -> dict:
    """Count skill states by computed status bucket, plus an `in_progress` aggregate."""
    out = {
        StudentSkillState.NOT_STARTED: 0,
        StudentSkillState.LEARNING_EASY: 0,
        StudentSkillState.LEARNING_MEDIUM: 0,
        StudentSkillState.LEARNING_HARD: 0,
        StudentSkillState.MASTERED: 0,
        StudentSkillState.NEEDS_REVIEW: 0,
    }
    for state in StudentSkillState.objects.filter(student=student):
        out[state.status] = out.get(state.status, 0) + 1
    out["in_progress"] = (
        out[StudentSkillState.LEARNING_EASY]
        + out[StudentSkillState.LEARNING_MEDIUM]
        + out[StudentSkillState.LEARNING_HARD]
    )
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
    status = serializers.CharField(read_only=True)
    mastery_level = serializers.FloatField(read_only=True)
    needs_review = serializers.BooleanField(read_only=True)

    class Meta:
        model = StudentSkillState
        fields = (
            "student",
            "skill",
            "skill_xp",
            "total_attempts",
            "last_practiced_at",
            "updated_at",
            "status",
            "mastery_level",
            "needs_review",
        )
        read_only_fields = fields
