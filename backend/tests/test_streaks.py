from datetime import date, datetime
from zoneinfo import ZoneInfo

import pytest
from django.utils import timezone

from apps.students.models import Student
from apps.students.services import streaks

BRUSSELS = ZoneInfo("Europe/Brussels")


@pytest.fixture
def student(user):
    return Student.objects.create(user=user, display_name="A", grade="P3")


@pytest.mark.django_db
def test_streak_first_activity_sets_one(student, monkeypatch):
    monkeypatch.setattr(streaks, "brussels_today", lambda: date(2026, 4, 15))
    streaks.update_streak(student)
    student.refresh_from_db()
    assert student.current_streak == 1
    assert student.best_streak == 1
    assert student.last_activity_date == date(2026, 4, 15)


@pytest.mark.django_db
def test_streak_increment_next_day(student, monkeypatch):
    student.current_streak = 1
    student.best_streak = 1
    student.last_activity_date = date(2026, 4, 14)
    student.save()

    monkeypatch.setattr(streaks, "brussels_today", lambda: date(2026, 4, 15))
    streaks.update_streak(student)
    student.refresh_from_db()
    assert student.current_streak == 2
    assert student.best_streak == 2


@pytest.mark.django_db
def test_streak_reset_after_gap(student, monkeypatch):
    student.current_streak = 4
    student.best_streak = 4
    student.last_activity_date = date(2026, 4, 10)
    student.save()

    monkeypatch.setattr(streaks, "brussels_today", lambda: date(2026, 4, 15))
    streaks.update_streak(student)
    student.refresh_from_db()
    assert student.current_streak == 1
    assert student.best_streak == 4  # best preserved


@pytest.mark.django_db
def test_streak_same_day_noop(student, monkeypatch):
    student.current_streak = 3
    student.best_streak = 3
    student.last_activity_date = date(2026, 4, 15)
    student.save()

    monkeypatch.setattr(streaks, "brussels_today", lambda: date(2026, 4, 15))
    streaks.update_streak(student)
    student.refresh_from_db()
    assert student.current_streak == 3


@pytest.mark.django_db
def test_streak_timezone_brussels_midnight(student, monkeypatch):
    """23:30 Brussels + 01:00 Brussels next day = consecutive days even if UTC straddles."""
    evening = datetime(2026, 4, 14, 23, 30, tzinfo=BRUSSELS)
    next_morning = datetime(2026, 4, 15, 1, 0, tzinfo=BRUSSELS)

    monkeypatch.setattr(timezone, "now", lambda: evening)
    streaks.update_streak(student)
    student.refresh_from_db()
    assert student.current_streak == 1
    assert student.last_activity_date == date(2026, 4, 14)

    monkeypatch.setattr(timezone, "now", lambda: next_morning)
    streaks.update_streak(student)
    student.refresh_from_db()
    assert student.current_streak == 2
    assert student.last_activity_date == date(2026, 4, 15)
