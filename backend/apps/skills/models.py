from django.core.exceptions import ValidationError
from django.db import models


class Skill(models.Model):
    id = models.CharField(primary_key=True, max_length=80)
    label = models.CharField(max_length=200)
    grade = models.CharField(max_length=4)
    description = models.TextField(blank=True, default="")
    mastery_threshold = models.PositiveSmallIntegerField(default=3)
    prerequisites = models.ManyToManyField(
        "self",
        through="SkillPrerequisite",
        through_fields=("skill", "prerequisite"),
        symmetrical=False,
        related_name="dependents",
    )

    class Meta:
        ordering = ["grade", "id"]

    def __str__(self) -> str:
        return f"{self.id} ({self.grade})"


class SkillPrerequisite(models.Model):
    skill = models.ForeignKey(Skill, on_delete=models.CASCADE, related_name="prerequisite_links")
    prerequisite = models.ForeignKey(
        Skill, on_delete=models.CASCADE, related_name="dependent_links"
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["skill", "prerequisite"], name="uq_skill_prereq"),
            models.CheckConstraint(
                check=~models.Q(skill=models.F("prerequisite")),
                name="no_self_prerequisite",
            ),
        ]

    def clean(self) -> None:
        if self.skill_id == self.prerequisite_id:
            raise ValidationError("A skill cannot be its own prerequisite.")

    def __str__(self) -> str:
        return f"{self.skill_id} ← {self.prerequisite_id}"
