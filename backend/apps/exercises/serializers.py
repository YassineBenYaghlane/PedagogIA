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
    answer = serializers.JSONField()
    params = serializers.JSONField()


class AttemptSerializer(serializers.ModelSerializer):
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
        read_only_fields = ("id", "session", "responded_at")
