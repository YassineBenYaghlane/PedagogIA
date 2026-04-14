import uuid

from django.db import models

from apps.skills.models import Skill


class ExerciseTemplate(models.Model):
    id = models.CharField(primary_key=True, max_length=120)
    skill = models.ForeignKey(Skill, on_delete=models.CASCADE, related_name="templates")
    difficulty = models.PositiveSmallIntegerField(default=1)
    template = models.JSONField()

    class Meta:
        ordering = ["skill_id", "difficulty", "id"]
        constraints = [
            models.CheckConstraint(
                check=models.Q(difficulty__gte=1) & models.Q(difficulty__lte=3),
                name="difficulty_range",
            ),
        ]


class Attempt(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(
        "learning_sessions.Session", on_delete=models.CASCADE, related_name="attempts"
    )
    skill = models.ForeignKey(Skill, on_delete=models.PROTECT)
    template = models.ForeignKey(ExerciseTemplate, on_delete=models.PROTECT)
    exercise_params = models.JSONField(default=dict)
    student_answer = models.CharField(max_length=200)
    correct_answer = models.CharField(max_length=200)
    is_correct = models.BooleanField()
    responded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-responded_at"]
