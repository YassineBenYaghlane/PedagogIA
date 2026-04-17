import uuid

from django.conf import settings
from django.db import models

from apps.skills.models import Skill

GRADE_CHOICES = [
    ("P1", "P1"),
    ("P2", "P2"),
    ("P3", "P3"),
    ("P4", "P4"),
    ("P5", "P5"),
    ("P6", "P6"),
]
GRADE_VALUES = [g for g, _ in GRADE_CHOICES]


class Student(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="students"
    )
    display_name = models.CharField(max_length=100)
    grade = models.CharField(max_length=2, choices=GRADE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    xp = models.PositiveIntegerField(default=0)
    rank = models.CharField(max_length=24, default="curieux")
    current_streak = models.PositiveIntegerField(default=0)
    best_streak = models.PositiveIntegerField(default=0)
    last_activity_date = models.DateField(null=True, blank=True)
    daily_goal = models.PositiveSmallIntegerField(default=5)

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
    next_review_at = models.DateTimeField(null=True, blank=True)
    review_interval_hours = models.PositiveIntegerField(default=24)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["student", "skill"], name="uq_student_skill"),
        ]


class StudentAchievement(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="achievements")
    code = models.CharField(max_length=48)
    earned_at = models.DateTimeField(auto_now_add=True)
    context = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-earned_at"]
        constraints = [
            models.UniqueConstraint(fields=["student", "code"], name="uq_student_achievement"),
        ]
