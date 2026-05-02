from django.db import models

from apps.students.models import Student


class VoiceUsage(models.Model):
    """Per-student monthly character counter for ElevenLabs TTS billing."""

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="voice_usage")
    year = models.IntegerField()
    month = models.IntegerField()
    chars_used = models.IntegerField(default=0)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["student", "year", "month"], name="uq_voice_usage_per_month"
            ),
        ]
        indexes = [models.Index(fields=["year", "month"])]

    def __str__(self) -> str:
        return f"{self.student_id} {self.year}-{self.month:02d}: {self.chars_used} chars"
