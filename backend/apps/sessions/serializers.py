from rest_framework import serializers

from apps.students.models import Student

from .models import Session


class SessionSerializer(serializers.ModelSerializer):
    student = serializers.PrimaryKeyRelatedField(queryset=Student.objects.all())

    class Meta:
        model = Session
        fields = ("id", "student", "mode", "started_at", "ended_at")
        read_only_fields = ("id", "started_at")

    def validate_student(self, student: Student) -> Student:
        user = self.context["request"].user
        if student.user_id != user.id:
            raise serializers.ValidationError("Invalid student.")
        return student


class SessionSummarySerializer(serializers.ModelSerializer):
    duration_seconds = serializers.SerializerMethodField()
    attempt_count = serializers.IntegerField(read_only=True)
    correct_count = serializers.IntegerField(read_only=True)
    accuracy = serializers.SerializerMethodField()
    skills = serializers.SerializerMethodField()

    class Meta:
        model = Session
        fields = (
            "id",
            "mode",
            "started_at",
            "ended_at",
            "duration_seconds",
            "attempt_count",
            "correct_count",
            "accuracy",
            "skills",
        )

    def get_duration_seconds(self, obj: Session) -> int | None:
        if not obj.ended_at:
            return None
        return int((obj.ended_at - obj.started_at).total_seconds())

    def get_accuracy(self, obj: Session) -> int | None:
        total = getattr(obj, "attempt_count", 0) or 0
        if not total:
            return None
        correct = getattr(obj, "correct_count", 0) or 0
        return round(100 * correct / total)

    def get_skills(self, obj: Session) -> list[dict]:
        seen: dict[str, str] = {}
        for attempt in obj.attempts.all():
            if attempt.skill_id not in seen:
                seen[attempt.skill_id] = attempt.skill.label
        return [{"id": sid, "label": label} for sid, label in seen.items()]
