import uuid

from django.db import models

from apps.exercises.models import Attempt
from apps.skills.models import Skill
from apps.students.models import Student

ROLE_CHOICES = [
    ("student", "student"),
    ("assistant", "assistant"),
    ("system", "system"),
]

KIND_FREE = "free"
KIND_EXERCICE = "exercice"
KIND_CHOICES = [
    (KIND_FREE, "Chat libre"),
    (KIND_EXERCICE, "Aide à l'exercice"),
]


class Conversation(models.Model):
    """One thread of student↔tutor messages. A student can have many."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="conversations")
    kind = models.CharField(max_length=16, choices=KIND_CHOICES, default=KIND_FREE)
    title = models.CharField(max_length=120, blank=True, default="")
    # Exercice-mode anchors — only set when kind=exercice.
    anchor_skill = models.ForeignKey(
        "skills.Skill", on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    anchor_attempt = models.ForeignKey(
        "exercises.Attempt", on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    # Exercice payload kept verbatim when the chat is opened *before* the student
    # answers — there's no Attempt to read from in that case.
    anchor_exercise_params = models.JSONField(default=dict, blank=True)
    anchor_exercise_prompt = models.CharField(max_length=500, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        indexes = [models.Index(fields=["student", "-updated_at"])]

    def __str__(self) -> str:
        return f"conv({self.student.display_name}, {self.id}, {self.kind})"


class Message(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name="messages"
    )
    role = models.CharField(max_length=16, choices=ROLE_CHOICES)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    # Context links — populated when a message is anchored to a specific exercise.
    context_attempt = models.ForeignKey(
        Attempt, on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    context_skill = models.ForeignKey(
        Skill, on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )

    # For assistant messages: which model produced this turn.
    model = models.CharField(max_length=64, blank=True, default="")

    # For assistant messages: the same reply rewritten with math symbols spelled
    # out for TTS (e.g. "16 / 8 = 2" → "seize divisé par huit égale deux").
    # Empty string means "no separate speech form, use content as-is".
    speech = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["created_at"]
        indexes = [models.Index(fields=["conversation", "created_at"])]
