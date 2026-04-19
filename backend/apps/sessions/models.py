import uuid

from django.db import models

from apps.skills.models import Skill
from apps.students.models import Student


class Session(models.Model):
    MODE_CHOICES = [
        ("training", "training"),
        ("diagnostic", "diagnostic"),
        ("drill", "drill"),
        ("exam", "exam"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="sessions")
    mode = models.CharField(max_length=20, choices=MODE_CHOICES, default="training")
    target_skill = models.ForeignKey(
        Skill, on_delete=models.SET_NULL, null=True, blank=True, related_name="drill_sessions"
    )
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-started_at"]

    def __str__(self) -> str:
        return f"{self.mode} @ {self.started_at:%Y-%m-%d}"
