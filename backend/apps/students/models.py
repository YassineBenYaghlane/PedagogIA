import uuid

from django.conf import settings
from django.db import models

from apps.skills.models import Skill


class Student(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    parent = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="students"
    )
    display_name = models.CharField(max_length=100)
    grade = models.CharField(max_length=4)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["display_name"]

    def __str__(self) -> str:
        return f"{self.display_name} ({self.grade})"


class StudentSkillState(models.Model):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    MASTERED = "mastered"
    NEEDS_REVIEW = "needs_review"
    STATUS_CHOICES = [
        (NOT_STARTED, "Pas commencé"),
        (IN_PROGRESS, "En cours"),
        (MASTERED, "Maîtrisé"),
        (NEEDS_REVIEW, "À revoir"),
    ]

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="skill_states")
    skill = models.ForeignKey(Skill, on_delete=models.CASCADE)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=NOT_STARTED)
    mastery_level = models.FloatField(default=0.0)
    consecutive_correct = models.PositiveIntegerField(default=0)
    total_attempts = models.PositiveIntegerField(default=0)
    last_practiced_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["student", "skill"], name="uq_student_skill"),
        ]
