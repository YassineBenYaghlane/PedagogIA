from rest_framework import serializers

from .models import Attempt, ExerciseTemplate


class ExerciseTemplateSerializer(serializers.ModelSerializer):
    skill_ids = serializers.SerializerMethodField()

    class Meta:
        model = ExerciseTemplate
        fields = ("id", "skill_ids", "difficulty", "input_type", "template")

    def get_skill_ids(self, obj: ExerciseTemplate) -> list[str]:
        return list(obj.skills.values_list("id", flat=True))


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
    skill_id = serializers.SerializerMethodField()
    skill_label = serializers.SerializerMethodField()
    input_type = serializers.SerializerMethodField()

    class Meta:
        model = Attempt
        fields = (
            "id",
            "session",
            "skill_id",
            "skill_label",
            "template",
            "input_type",
            "exercise_params",
            "prompt",
            "student_answer",
            "correct_answer",
            "is_correct",
            "xp_awarded",
            "responded_at",
        )
        read_only_fields = fields

    def _first_skill(self, obj: Attempt):
        return obj.template.skills.first() if obj.template_id else None

    def get_prompt(self, obj: Attempt) -> str:
        return render_prompt(obj.template.template, obj.exercise_params or {})

    def get_skill_id(self, obj: Attempt) -> str:
        skill = self._first_skill(obj)
        return skill.id if skill else ""

    def get_skill_label(self, obj: Attempt) -> str:
        skill = self._first_skill(obj)
        return (getattr(skill, "label", "") or (skill.id if skill else "")) if skill else ""

    def get_input_type(self, obj: Attempt) -> str:
        return obj.template.input_type if obj.template_id else ""


class AttemptCreateSerializer(serializers.Serializer):
    signature = serializers.CharField()
    student_answer = serializers.CharField(allow_blank=True)
