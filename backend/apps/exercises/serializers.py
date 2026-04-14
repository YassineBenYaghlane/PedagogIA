from rest_framework import serializers

from .models import Attempt, ExerciseTemplate


class ExerciseTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExerciseTemplate
        fields = ("id", "skill", "difficulty", "template")


class GeneratedExerciseSerializer(serializers.Serializer):
    template_id = serializers.CharField()
    skill_id = serializers.CharField()
    difficulty = serializers.IntegerField()
    type = serializers.CharField()
    prompt = serializers.CharField()
    params = serializers.JSONField()
    signature = serializers.CharField()


class AttemptReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attempt
        fields = (
            "id",
            "session",
            "skill",
            "template",
            "exercise_params",
            "student_answer",
            "correct_answer",
            "is_correct",
            "responded_at",
        )
        read_only_fields = fields


class AttemptCreateSerializer(serializers.Serializer):
    signature = serializers.CharField()
    student_answer = serializers.CharField(allow_blank=True)
