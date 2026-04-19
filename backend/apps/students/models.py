import uuid
from datetime import timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone

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

SKILL_XP_MAX = 30.0
REVIEW_STALE_DAYS = 30
REVIEW_XP_CEILING = 20.0


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
    LEARNING_EASY = "learning_easy"
    LEARNING_MEDIUM = "learning_medium"
    LEARNING_HARD = "learning_hard"
    MASTERED = "mastered"
    NEEDS_REVIEW = "needs_review"

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="skill_states")
    skill = models.ForeignKey(Skill, on_delete=models.CASCADE)
    skill_xp = models.FloatField(default=0.0)
    total_attempts = models.PositiveIntegerField(default=0)
    last_practiced_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["student", "skill"], name="uq_student_skill"),
            models.CheckConstraint(
                check=models.Q(skill_xp__gte=0) & models.Q(skill_xp__lte=SKILL_XP_MAX),
                name="skill_xp_range",
            ),
        ]

    @property
    def mastery_level(self) -> float:
        return self.skill_xp / SKILL_XP_MAX

    @property
    def needs_review(self) -> bool:
        if self.skill_xp >= REVIEW_XP_CEILING or self.last_practiced_at is None:
            return False
        return self.last_practiced_at < timezone.now() - timedelta(days=REVIEW_STALE_DAYS)

    @property
    def status(self) -> str:
        if self.skill_xp >= SKILL_XP_MAX:
            return self.MASTERED
        if self.needs_review:
            return self.NEEDS_REVIEW
        if self.skill_xp >= 20:
            return self.LEARNING_HARD
        if self.skill_xp >= 10:
            return self.LEARNING_MEDIUM
        if self.skill_xp > 0 or self.total_attempts > 0:
            return self.LEARNING_EASY
        return self.NOT_STARTED


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
