import uuid

from django.db import models

from apps.skills.models import Skill

INPUT_TYPES = [
    ("number", "Number"),
    ("mcq", "MCQ"),
    ("mcq_multi", "MCQ multi-correct"),
    ("symbol", "Symbol"),
    ("binary_equality", "Binary equality"),
    ("decomposition", "Decomposition"),
    ("point_on_line", "Point on number line"),
    ("drag_order", "Drag to order"),
]


class ExerciseTemplate(models.Model):
    id = models.CharField(primary_key=True, max_length=120)
    difficulty = models.PositiveSmallIntegerField(default=1)
    input_type = models.CharField(max_length=20, choices=INPUT_TYPES, default="number")
    template = models.JSONField()
    skills = models.ManyToManyField(Skill, through="TemplateSkillWeight", related_name="templates")

    class Meta:
        ordering = ["difficulty", "id"]
        constraints = [
            models.CheckConstraint(
                check=models.Q(difficulty__gte=1) & models.Q(difficulty__lte=3),
                name="difficulty_range",
            ),
        ]


class TemplateSkillWeight(models.Model):
    template = models.ForeignKey(
        ExerciseTemplate, on_delete=models.CASCADE, related_name="skill_weights"
    )
    skill = models.ForeignKey(Skill, on_delete=models.CASCADE, related_name="template_weights")
    weight = models.FloatField()

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["template", "skill"], name="uq_template_skill"),
            models.CheckConstraint(
                check=models.Q(weight__gt=0) & models.Q(weight__lte=1),
                name="weight_range_0_1",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.template_id} · {self.skill_id} = {self.weight}"


class Attempt(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(
        "learning_sessions.Session", on_delete=models.CASCADE, related_name="attempts"
    )
    template = models.ForeignKey(ExerciseTemplate, on_delete=models.PROTECT)
    exercise_params = models.JSONField(default=dict)
    student_answer = models.CharField(max_length=200)
    correct_answer = models.CharField(max_length=200)
    is_correct = models.BooleanField()
    xp_awarded = models.PositiveIntegerField(default=0)
    responded_at = models.DateTimeField(auto_now_add=True)
    signature_hash = models.CharField(max_length=64, unique=True, null=True, blank=True)
    error_tag = models.CharField(max_length=60, null=True, blank=True)

    class Meta:
        ordering = ["-responded_at"]
