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


def render_prompt(template_dict: dict, params: dict) -> str:
    """Best-effort reconstruction of the original prompt from template + stored params."""
    try:
        pt = (template_dict or {}).get("prompt_template") or ""
        if not pt:
            return ""
        if "sequence" in params and "gap_index" in params:
            seq = params["sequence"]
            gap = params["gap_index"]
            display = [str(n) if i != gap else "?" for i, n in enumerate(seq)]
            return pt.format(sequence=" , ".join(display))
        return pt.format(**params)
    except (KeyError, IndexError, ValueError, AttributeError):
        return ""


class AttemptReadSerializer(serializers.ModelSerializer):
    prompt = serializers.SerializerMethodField()
    skill_label = serializers.SerializerMethodField()

    class Meta:
        model = Attempt
        fields = (
            "id",
            "session",
            "skill",
            "skill_label",
            "template",
            "input_type",
            "exercise_params",
            "prompt",
            "student_answer",
            "correct_answer",
            "is_correct",
            "responded_at",
        )
        read_only_fields = fields

    def get_prompt(self, obj: Attempt) -> str:
        return render_prompt(obj.template.template, obj.exercise_params or {})

    def get_skill_label(self, obj: Attempt) -> str:
        return getattr(obj.skill, "label", "") or obj.skill_id


class AttemptCreateSerializer(serializers.Serializer):
    signature = serializers.CharField()
    student_answer = serializers.CharField(allow_blank=True)
