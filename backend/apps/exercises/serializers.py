from rest_framework import serializers

from .models import Attempt, ExerciseTemplate


class ExerciseTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExerciseTemplate
        fields = ("id", "skill", "difficulty", "input_type", "template")


class GeneratedExerciseSerializer(serializers.Serializer):
    template_id = serializers.CharField()
    skill_id = serializers.CharField()
    difficulty = serializers.IntegerField()
    type = serializers.CharField()
    input_type = serializers.CharField()
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
            "input_type",
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
