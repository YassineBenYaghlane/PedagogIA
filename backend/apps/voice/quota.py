"""Per-student monthly TTS quota — keeps the ElevenLabs bill on the Starter tier."""

from __future__ import annotations

from dataclasses import dataclass

from django.conf import settings
from django.db import transaction
from django.db.models import F
from django.utils import timezone

from apps.students.models import Student

from .models import VoiceUsage


class QuotaExceeded(Exception):
    """Raised when a TTS request would push the student past their monthly cap."""

    def __init__(self, used: int, cap: int):
        self.used = used
        self.cap = cap
        super().__init__(f"voice quota exceeded ({used}/{cap})")


@dataclass(frozen=True)
class UsageSnapshot:
    used: int
    cap: int

    @property
    def percent(self) -> int:
        if self.cap <= 0:
            return 0
        return min(100, int(round(100 * self.used / self.cap)))

    @property
    def remaining(self) -> int:
        return max(0, self.cap - self.used)


def _now_yyyy_mm() -> tuple[int, int]:
    now = timezone.now()
    return now.year, now.month


def get_usage(student: Student) -> UsageSnapshot:
    year, month = _now_yyyy_mm()
    cap = settings.TTS_MONTHLY_CHAR_CAP_PER_STUDENT
    row = VoiceUsage.objects.filter(student=student, year=year, month=month).first()
    return UsageSnapshot(used=row.chars_used if row else 0, cap=cap)


def reserve(student: Student, char_count: int) -> UsageSnapshot:
    """Atomically reserve `char_count` chars for the student, or raise QuotaExceeded.

    Returns the post-increment usage snapshot so callers can pass it to clients.
    """
    if char_count <= 0:
        return get_usage(student)
    year, month = _now_yyyy_mm()
    cap = settings.TTS_MONTHLY_CHAR_CAP_PER_STUDENT
    with transaction.atomic():
        usage, _ = VoiceUsage.objects.select_for_update().get_or_create(
            student=student, year=year, month=month
        )
        if usage.chars_used + char_count > cap:
            raise QuotaExceeded(used=usage.chars_used, cap=cap)
        VoiceUsage.objects.filter(pk=usage.pk).update(chars_used=F("chars_used") + char_count)
        usage.refresh_from_db(fields=["chars_used"])
    return UsageSnapshot(used=usage.chars_used, cap=cap)
